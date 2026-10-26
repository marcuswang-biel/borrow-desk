import {
	CurrentUser,
	EquipmentCodeTaken,
	EquipmentNotFound,
	Forbidden,
	LoanConflict,
	type User,
} from '@borrow-desk/api';
import { assert, it } from '@effect/vitest';
import * as Clock from 'effect/Clock';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import * as TestClock from 'effect/testing/TestClock';

import {
	EquipmentLive,
	EquipmentService,
	LoansLive,
	LoansService,
	RemindersLive,
	RemindersService,
	scanOverdue,
} from '../src/features/index.ts';
import { Reminder } from '../src/repo/index.ts';
import { EquipmentRepoMemory, LoanRepoMemory, ReminderMemory } from './memory.ts';

/** Signed-in admin used by the permission test. */
const admin: User = {
	id: 'admin-1',
	email: 'admin@example.com',
	name: 'Ada Admin',
	role: 'admin',
};

/** Signed-in employee who borrows first. */
const ada: User = {
	id: 'ada',
	email: 'ada@example.com',
	name: 'Ada',
	role: 'employee',
};

/** Signed-in employee who hits the overlap. */
const bob: User = {
	id: 'bob',
	email: 'bob@example.com',
	name: 'Bob',
	role: 'employee',
};

/** In-memory equipment and loan repositories. */
const memoryRepos = Layer.mergeAll(EquipmentRepoMemory, LoanRepoMemory);

/** Memory repositories, the use cases, and the reminder outbox. */
const services = Layer.mergeAll(
	Layer.mergeAll(EquipmentLive, LoansLive, RemindersLive).pipe(
		Layer.provide(Layer.mergeAll(memoryRepos, ReminderMemory)),
	),
	ReminderMemory,
	memoryRepos,
);

/** Runs a program with the memory services and one current user. */
const asUser = <A, E, R>(user: User, program: Effect.Effect<A, E, R>) =>
	program.pipe(Effect.provideService(CurrentUser, user), Effect.provide(services));

it.effect('an employee cannot record equipment', () =>
	Effect.gen(function* () {
		const equipment = yield* EquipmentService;
		const error = yield* equipment.create({ name: 'Camera', code: '1' }).pipe(Effect.flip);
		assert.instanceOf(error, Forbidden);
	}).pipe((program) => asUser(ada, program)),
);

it.effect('the same kind can be recorded under different numbers', () =>
	Effect.gen(function* () {
		const equipment = yield* EquipmentService;
		const loans = yield* LoansService;
		const first = yield* equipment
			.create({ name: 'Camera', code: '1' })
			.pipe(Effect.provideService(CurrentUser, admin));
		const second = yield* equipment
			.create({ name: 'Camera', code: '2' })
			.pipe(Effect.provideService(CurrentUser, admin));
		yield* loans
			.borrow({ equipmentId: first.id, startsAt: 0, endsAt: 10_000 })
			.pipe(Effect.provideService(CurrentUser, ada));
		const booked = yield* loans
			.borrow({ equipmentId: second.id, startsAt: 0, endsAt: 10_000 })
			.pipe(Effect.provideService(CurrentUser, bob));
		assert.strictEqual(booked.equipmentId, second.id);
	}).pipe(Effect.provide(services)),
);

it.effect('the same name and number cannot be recorded twice', () =>
	Effect.gen(function* () {
		const equipment = yield* EquipmentService;
		yield* equipment
			.create({ name: 'Camera', code: '1' })
			.pipe(Effect.provideService(CurrentUser, admin));
		const error = yield* equipment
			.create({ name: 'Camera', code: '1' })
			.pipe(Effect.provideService(CurrentUser, admin), Effect.flip);
		assert.instanceOf(error, EquipmentCodeTaken);
	}).pipe(Effect.provide(services)),
);

it.effect('a loan reports the other borrower when the times overlap', () =>
	Effect.gen(function* () {
		const equipment = yield* EquipmentService;
		const loans = yield* LoansService;
		const camera = yield* equipment
			.create({ name: 'Camera', code: '1' })
			.pipe(Effect.provideService(CurrentUser, admin));
		yield* loans
			.borrow({ equipmentId: camera.id, startsAt: 0, endsAt: 10_000 })
			.pipe(Effect.provideService(CurrentUser, ada));
		const error = yield* loans
			.borrow({ equipmentId: camera.id, startsAt: 5_000, endsAt: 15_000 })
			.pipe(Effect.provideService(CurrentUser, bob), Effect.flip);
		assert.instanceOf(error, LoanConflict);
		if (error instanceof LoanConflict) {
			assert.strictEqual(error.borrowerName, 'Ada');
		}
	}).pipe(Effect.provide(services)),
);

it.effect('touching ranges do not overlap', () =>
	Effect.gen(function* () {
		const equipment = yield* EquipmentService;
		const loans = yield* LoansService;
		const camera = yield* equipment
			.create({ name: 'Camera', code: '1' })
			.pipe(Effect.provideService(CurrentUser, admin));
		yield* loans
			.borrow({ equipmentId: camera.id, startsAt: 0, endsAt: 10_000 })
			.pipe(Effect.provideService(CurrentUser, ada));
		const second = yield* loans
			.borrow({ equipmentId: camera.id, startsAt: 10_000, endsAt: 20_000 })
			.pipe(Effect.provideService(CurrentUser, bob));
		assert.strictEqual(second.borrowerName, 'Bob');
	}).pipe(Effect.provide(services)),
);

it.effect('borrowing missing equipment fails', () =>
	Effect.gen(function* () {
		const loans = yield* LoansService;
		const error = yield* loans
			.borrow({ equipmentId: 'missing', startsAt: 0, endsAt: 1 })
			.pipe(Effect.flip);
		assert.instanceOf(error, EquipmentNotFound);
	}).pipe((program) => asUser(ada, program)),
);

it.effect('an overdue loan is reminded once', () =>
	Effect.gen(function* () {
		const equipment = yield* EquipmentService;
		const loans = yield* LoansService;
		const reminder = yield* Reminder;
		const camera = yield* equipment
			.create({ name: 'Camera', code: '1' })
			.pipe(Effect.provideService(CurrentUser, admin));
		yield* loans
			.borrow({ equipmentId: camera.id, startsAt: 0, endsAt: 1_000 })
			.pipe(Effect.provideService(CurrentUser, ada));
		yield* TestClock.setTime(500);
		yield* scanOverdue;
		assert.strictEqual((yield* reminder.list()).length, 0);
		yield* TestClock.adjust('1 second');
		yield* scanOverdue;
		const first = yield* reminder.list();
		assert.strictEqual(first.length, 1);
		assert.strictEqual(first[0]?.userId, ada.id);
		assert.strictEqual(first[0]?.message, 'Ada has not returned Camera 1');
		yield* scanOverdue;
		assert.strictEqual((yield* reminder.list()).length, 1);
		const now = yield* Clock.currentTimeMillis;
		assert.strictEqual(now > 1_000, true);
	}).pipe(Effect.provide(services)),
);

it.effect('a borrower sees only their own reminder', () =>
	Effect.gen(function* () {
		const equipment = yield* EquipmentService;
		const loans = yield* LoansService;
		const reminders = yield* RemindersService;
		const camera = yield* equipment
			.create({ name: 'Camera', code: '1' })
			.pipe(Effect.provideService(CurrentUser, admin));
		yield* loans
			.borrow({ equipmentId: camera.id, startsAt: 0, endsAt: 1_000 })
			.pipe(Effect.provideService(CurrentUser, ada));
		yield* TestClock.setTime(2_000);
		yield* scanOverdue;
		const mine = yield* reminders.list().pipe(Effect.provideService(CurrentUser, ada));
		const others = yield* reminders.list().pipe(Effect.provideService(CurrentUser, bob));
		assert.strictEqual(mine.length, 1);
		assert.strictEqual(mine[0]?.message, 'Ada has not returned Camera 1');
		assert.strictEqual(others.length, 0);
	}).pipe(Effect.provide(services)),
);
