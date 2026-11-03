import * as Effect from 'effect/Effect';
import { SqlClient } from 'effect/sql/SqlClient';

/** Records when the borrower read an overdue reminder. */
export default Effect.gen(function* () {
	const sql = yield* SqlClient;
	yield* sql`
		alter table reminders
			add column read_at bigint
	`;
});
