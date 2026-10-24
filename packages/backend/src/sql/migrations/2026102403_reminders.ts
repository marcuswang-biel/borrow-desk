import * as Effect from 'effect/Effect';
import { SqlClient } from 'effect/sql/SqlClient';

/** Creates the record of overdue reminders already sent. */
export default Effect.gen(function* () {
	const sql = yield* SqlClient;
	yield* sql`
		create table reminders (
			loan_id text primary key references loans (id),
			user_id text not null,
			message text not null,
			sent_at bigint not null
		)
	`;
});
