import { Api } from '@borrow-desk/api';
import * as Effect from 'effect/Effect';
import * as HttpApiClient from 'effect/http-api/HttpApiClient';
import * as FetchHttpClient from 'effect/http/FetchHttpClient';
import * as HttpClient from 'effect/http/HttpClient';
import * as HttpClientRequest from 'effect/http/HttpClientRequest';
import * as Layer from 'effect/Layer';

import { sessionToken } from './auth.ts';

/** Fetch client that reads the Better Auth JWT at call time. */
const authedClient = Layer.effect(
	HttpClient.HttpClient,
	Effect.gen(function* () {
		const client = yield* HttpClient.HttpClient;
		const token = yield* Effect.promise(sessionToken);
		if (token === undefined) {
			return client;
		}
		return HttpClient.mapRequest(client, (request) =>
			HttpClientRequest.bearerToken(request, token),
		);
	}),
).pipe(Layer.provide(FetchHttpClient.layer));

/** Runs one effect that may build the typed API client. */
const run = <A, E>(effect: Effect.Effect<A, E, HttpClient.HttpClient>) =>
	Effect.runPromise(effect.pipe(Effect.provide(authedClient)));

/** Asks the API whether PostgreSQL answered. */
export const getHealth = () =>
	run(
		Effect.gen(function* () {
			const api = yield* HttpApiClient.make(Api, { baseUrl: window.location.origin });
			return yield* api.health.getHealth();
		}),
	);

/** Loads the signed-in person. */
export const getMe = () =>
	run(
		Effect.gen(function* () {
			const api = yield* HttpApiClient.make(Api, { baseUrl: window.location.origin });
			return yield* api.session.getMe();
		}),
	);

/** Loads the equipment catalog. */
export const listEquipment = () =>
	run(
		Effect.gen(function* () {
			const api = yield* HttpApiClient.make(Api, { baseUrl: window.location.origin });
			return yield* api.equipment.listEquipment();
		}),
	);

/** Records one piece of equipment. */
export const createEquipment = (name: string, code: string) =>
	run(
		Effect.gen(function* () {
			const api = yield* HttpApiClient.make(Api, { baseUrl: window.location.origin });
			return yield* api.equipment.createEquipment({ payload: { name, code } });
		}),
	);

/** Loads every loan. */
export const listLoans = () =>
	run(
		Effect.gen(function* () {
			const api = yield* HttpApiClient.make(Api, { baseUrl: window.location.origin });
			return yield* api.loans.listLoans();
		}),
	);

/** Borrows one piece of equipment for a millisecond range. */
export const borrow = (equipmentId: string, startsAt: number, endsAt: number) =>
	run(
		Effect.gen(function* () {
			const api = yield* HttpApiClient.make(Api, { baseUrl: window.location.origin });
			return yield* api.loans.borrow({ payload: { equipmentId, startsAt, endsAt } });
		}),
	);

/** Marks a loan returned. */
export const returnLoan = (id: string) =>
	run(
		Effect.gen(function* () {
			const api = yield* HttpApiClient.make(Api, { baseUrl: window.location.origin });
			return yield* api.loans.returnLoan({ params: { id } });
		}),
	);
