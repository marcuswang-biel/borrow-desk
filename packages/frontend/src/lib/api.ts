import { Api } from '@borrow-desk/api';
import * as Effect from 'effect/Effect';
import * as HttpApiClient from 'effect/http-api/HttpApiClient';

/** Typed client for the shared HTTP contract. */
const desk = HttpApiClient.make(Api, { baseUrl: window.location.origin });

/** Loads the signed-in person, the catalog, the loans, and that person's reminders. */
export const loadDesk = Effect.flatMap(desk, (api) =>
	Effect.all(
		[
			api.session.getMe(),
			api.equipment.listEquipment(),
			api.loans.listLoans(),
			api.reminders.listReminders(),
		],
		{ concurrency: 'unbounded' },
	),
);

/** Records one piece of equipment. */
export const createEquipment = (name: string, code: string) =>
	Effect.flatMap(desk, (api) => api.equipment.createEquipment({ payload: { name, code } }));

/** Borrows one piece of equipment for a millisecond range. */
export const borrow = (equipmentId: string, startsAt: number, endsAt: number) =>
	Effect.flatMap(desk, (api) => api.loans.borrow({ payload: { equipmentId, startsAt, endsAt } }));

/** Loads reminders sent to the signed-in borrower. */
export const listReminders = Effect.flatMap(desk, (api) => api.reminders.listReminders());

/** Marks a loan returned. */
export const returnLoan = (id: string) =>
	Effect.flatMap(desk, (api) => api.loans.returnLoan({ params: { id } }));
