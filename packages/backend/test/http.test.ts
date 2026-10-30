import {
	Api,
	Authentication,
	BorrowLoan,
	CreateEquipment,
	CurrentUser,
	Unauthorized,
	type User,
} from '@borrow-desk/api';
import { assert, layer } from '@effect/vitest';
import * as DateTime from 'effect/DateTime';
import * as Effect from 'effect/Effect';
import * as HttpApiMiddleware from 'effect/http-api/HttpApiMiddleware';
import * as HttpApiTest from 'effect/http-api/HttpApiTest';
import * as HttpClientRequest from 'effect/http/HttpClientRequest';
import * as HttpServer from 'effect/http/HttpServer';
import * as Layer from 'effect/Layer';
import * as Redacted from 'effect/Redacted';

import {
	EquipmentHttpLive,
	EquipmentLive,
	LoansHttpLive,
	LoansLive,
} from '../src/features/index.ts';
import { EquipmentRepoMemory, LoanRepoMemory } from './memory.ts';

/** People the test bearer tokens stand for. */
const users: Record<string, User> = {
	admin: { id: 'admin', email: 'admin@example.com', name: 'Admin', role: 'admin' },
	ada: { id: 'ada', email: 'ada@example.com', name: 'Ada', role: 'employee' },
	ben: { id: 'ben', email: 'ben@example.com', name: 'Ben', role: 'employee' },
};

/** Accepts the tokens in `users` and provides that person to the handler. */
const AuthenticationTest = Layer.succeed(
	Authentication,
	Authentication.of({
		bearer: (httpEffect, { credential }) => {
			const user = users[Redacted.value(credential)];
			if (user === undefined) {
				return Effect.fail(new Unauthorized({ message: 'Missing bearer token' }));
			}
			return Effect.provideService(httpEffect, CurrentUser, user);
		},
	}),
);

/** HTTP handlers over the in-memory catalog and ledger. */
const HandlersLayer = Layer.mergeAll(EquipmentHttpLive, LoansHttpLive).pipe(
	Layer.provide(Layer.mergeAll(EquipmentLive, LoansLive)),
	Layer.provide(Layer.mergeAll(EquipmentRepoMemory, LoanRepoMemory)),
	Layer.provideMerge(AuthenticationTest),
);

/** Client middleware that attaches one test token. */
const withToken = (token: string) =>
	HttpApiMiddleware.layerClient(Authentication, ({ next, request }) =>
		next(HttpClientRequest.bearerToken(request, token)),
	);

/** Client middleware that sends no token. */
const withoutToken = HttpApiMiddleware.layerClient(Authentication, ({ next, request }) =>
	next(request),
);

/** In-memory client for the equipment and loan groups. */
const makeClient = HttpApiTest.groups(Api, ['equipment', 'loans']);

layer(Layer.mergeAll(HandlersLayer, HttpServer.layerServices))('Loans HTTP', (it) => {
	it.effect('names the other borrower when the time overlaps', () =>
		Effect.gen(function* () {
			const admin = yield* Effect.provide(makeClient, withToken('admin'));
			const ada = yield* Effect.provide(makeClient, withToken('ada'));
			const ben = yield* Effect.provide(makeClient, withToken('ben'));
			const item = yield* admin.equipment.createEquipment({
				payload: new CreateEquipment({ name: 'Camera', code: '1' }),
			});
			const startsAt = DateTime.makeUnsafe(0);
			const endsAt = DateTime.makeUnsafe(10_000);
			const payload = new BorrowLoan({ equipmentId: item.id, startsAt, endsAt });
			yield* ada.loans.borrow({ payload });
			const error = yield* ben.loans.borrow({ payload }).pipe(Effect.flip);
			assert.strictEqual(error._tag, 'LoanConflict');
			if (error._tag === 'LoanConflict') {
				assert.strictEqual(error.borrowerName, 'Ada');
			}
		}),
	);

	it.effect('rejects a loan request that has no bearer token', () =>
		Effect.gen(function* () {
			const anon = yield* Effect.provide(makeClient, withoutToken);
			const error = yield* anon.loans
				.borrow({
					payload: new BorrowLoan({
						equipmentId: 'missing',
						startsAt: DateTime.makeUnsafe(0),
						endsAt: DateTime.makeUnsafe(1),
					}),
				})
				.pipe(Effect.flip);
			assert.strictEqual(error._tag, 'Unauthorized');
		}),
	);
});
