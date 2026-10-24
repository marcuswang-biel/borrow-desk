import type { Loan } from '@borrow-desk/api';

import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import { SqlClient } from 'effect/sql/SqlClient';

import { LoanRepo } from './loans.ts';

/** One loan row as PostgreSQL returns it. */
interface LoanRow {
	readonly id: string;
	readonly equipment_id: string;
	readonly borrower_id: string;
	readonly borrower_name: string;
	readonly starts_at: string | number;
	readonly ends_at: string | number;
	readonly returned_at: string | number | null;
}

/** Maps a database row onto the shared loan schema. */
const toLoan = (row: LoanRow): Loan => ({
	id: row.id,
	equipmentId: row.equipment_id,
	borrowerId: row.borrower_id,
	borrowerName: row.borrower_name,
	startsAt: Number(row.starts_at),
	endsAt: Number(row.ends_at),
	returnedAt: row.returned_at === null ? null : Number(row.returned_at),
});

/** Ledger backed by the loans and reminders tables. */
export const LoanRepoSql = Layer.effect(
	LoanRepo,
	Effect.gen(function* () {
		const sql = yield* SqlClient;
		return {
			insert: (loan) =>
				sql`
					insert into loans (
						id, equipment_id, borrower_id, borrower_name, starts_at, ends_at, returned_at
					) values (
						${loan.id},
						${loan.equipmentId},
						${loan.borrowerId},
						${loan.borrowerName},
						${loan.startsAt},
						${loan.endsAt},
						${loan.returnedAt}
					)
				`.pipe(Effect.asVoid, Effect.orDie),
			list: () =>
				sql<LoanRow>`select id, equipment_id, borrower_id, borrower_name, starts_at, ends_at, returned_at from loans order by starts_at`.pipe(
					Effect.map((rows) => rows.map(toLoan)),
					Effect.orDie,
				),
			findById: (id) =>
				sql<LoanRow>`select id, equipment_id, borrower_id, borrower_name, starts_at, ends_at, returned_at from loans where id = ${id}`.pipe(
					Effect.map((rows) => {
						const row = rows[0];
						return row === undefined ? undefined : toLoan(row);
					}),
					Effect.orDie,
				),
			findOverlap: (equipmentId, startsAt, endsAt) =>
				sql<LoanRow>`
					select id, equipment_id, borrower_id, borrower_name, starts_at, ends_at, returned_at
					from loans
					where equipment_id = ${equipmentId}
						and returned_at is null
						and starts_at < ${endsAt}
						and ends_at > ${startsAt}
					limit 1
				`.pipe(
					Effect.map((rows) => {
						const row = rows[0];
						return row === undefined ? undefined : toLoan(row);
					}),
					Effect.orDie,
				),
			markReturned: (id, returnedAt) =>
				sql`update loans set returned_at = ${returnedAt} where id = ${id}`.pipe(
					Effect.asVoid,
					Effect.orDie,
				),
			listOverdue: (now) =>
				sql<LoanRow>`
					select id, equipment_id, borrower_id, borrower_name, starts_at, ends_at, returned_at
					from loans
					where returned_at is null
						and ends_at < ${now}
						and not exists (select 1 from reminders where reminders.loan_id = loans.id)
				`.pipe(
					Effect.map((rows) => rows.map(toLoan)),
					Effect.orDie,
				),
		};
	}),
);
