import { Loan } from '@borrow-desk/api';
import * as DateTime from 'effect/DateTime';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import * as Schema from 'effect/Schema';
import { SqlClient } from 'effect/sql/SqlClient';
import * as SqlSchema from 'effect/sql/SqlSchema';

import { asDefect } from '../../sql/defect.ts';
import { DbInstant, DbInstantOrNull, millis } from '../../sql/instant.ts';
import { LoanRepo } from './loans.ts';

/** One loan row with columns aliased to the domain names. */
const LoanRow = Schema.Struct({
	id: Schema.String,
	equipmentId: Schema.String,
	borrowerId: Schema.String,
	borrowerName: Schema.String,
	startsAt: DbInstant,
	endsAt: DbInstant,
	returnedAt: DbInstantOrNull,
});

/** Ledger backed by the loans table. */
export const LoanRepoSql = Layer.effect(
	LoanRepo,
	Effect.gen(function* () {
		const sql = yield* SqlClient;
		const decode = Schema.decodeUnknownEffect(Loan);
		const toLoan = (row: typeof LoanRow.Type) => decode(row);
		const read = SqlSchema.findAll({
			Request: Schema.Void,
			Result: LoanRow,
			execute: () =>
				sql`select id, equipment_id as "equipmentId", borrower_id as "borrowerId", borrower_name as "borrowerName", starts_at::float8 as "startsAt", ends_at::float8 as "endsAt", returned_at::float8 as "returnedAt" from loans order by starts_at`,
		});
		const findByIdQuery = SqlSchema.findAll({
			Request: Schema.String,
			Result: LoanRow,
			execute: (id) =>
				sql`select id, equipment_id as "equipmentId", borrower_id as "borrowerId", borrower_name as "borrowerName", starts_at::float8 as "startsAt", ends_at::float8 as "endsAt", returned_at::float8 as "returnedAt" from loans where id = ${id}`,
		});
		const overlapQuery = SqlSchema.findAll({
			Request: Schema.Struct({
				equipmentId: Schema.String,
				startsAt: Schema.Number,
				endsAt: Schema.Number,
			}),
			Result: LoanRow,
			execute: (request) => sql`
				select id, equipment_id as "equipmentId", borrower_id as "borrowerId", borrower_name as "borrowerName", starts_at::float8 as "startsAt", ends_at::float8 as "endsAt", returned_at::float8 as "returnedAt"
				from loans
				where equipment_id = ${request.equipmentId}
					and returned_at is null
					and starts_at < ${request.endsAt}
					and ends_at > ${request.startsAt}
				limit 1
			`,
		});
		const overdueQuery = SqlSchema.findAll({
			Request: Schema.Number,
			Result: LoanRow,
			execute: (now) => sql`
				select id, equipment_id as "equipmentId", borrower_id as "borrowerId", borrower_name as "borrowerName", starts_at::float8 as "startsAt", ends_at::float8 as "endsAt", returned_at::float8 as "returnedAt"
				from loans
				where returned_at is null
					and ends_at < ${now}
					and not exists (select 1 from reminders where reminders.loan_id = loans.id)
			`,
		});

		const list = Effect.fn('LoanRepo.list')(function* () {
			return yield* Effect.forEach(yield* read(), toLoan);
		}, asDefect);

		const findById = Effect.fn('LoanRepo.findById')(function* (id: string) {
			const rows = yield* findByIdQuery(id);
			const row = rows[0];
			return row === undefined ? undefined : yield* toLoan(row);
		}, asDefect);

		const findOverlap = Effect.fn('LoanRepo.findOverlap')(function* (
			equipmentId: string,
			startsAt: DateTime.DateTime,
			endsAt: DateTime.DateTime,
		) {
			const rows = yield* overlapQuery({
				equipmentId,
				startsAt: millis(startsAt),
				endsAt: millis(endsAt),
			});
			const row = rows[0];
			return row === undefined ? undefined : yield* toLoan(row);
		}, asDefect);

		const insertIfFree = Effect.fn('LoanRepo.insertIfFree')(function* (loan: Loan) {
			return yield* sql.withTransaction(
				Effect.gen(function* () {
					const clash = yield* findOverlap(loan.equipmentId, loan.startsAt, loan.endsAt);
					if (clash !== undefined) {
						return clash;
					}
					yield* sql`
						insert into loans (
							id, equipment_id, borrower_id, borrower_name, starts_at, ends_at, returned_at
						) values (
							${loan.id},
							${loan.equipmentId},
							${loan.borrowerId},
							${loan.borrowerName},
							${millis(loan.startsAt)},
							${millis(loan.endsAt)},
							${null}
						)
					`;
					return undefined;
				}),
			);
		}, asDefect);

		const markReturned = Effect.fn('LoanRepo.markReturned')(function* (
			id: string,
			returnedAt: DateTime.Utc,
		) {
			yield* sql`update loans set returned_at = ${millis(returnedAt)} where id = ${id}`;
		}, asDefect);

		const listOverdue = Effect.fn('LoanRepo.listOverdue')(function* (now: DateTime.Utc) {
			return yield* Effect.forEach(yield* overdueQuery(millis(now)), toLoan);
		}, asDefect);

		return LoanRepo.of({ list, findById, insertIfFree, markReturned, listOverdue });
	}),
);
