import * as Effect from 'effect/Effect';
import { SqlClient } from 'effect/sql/SqlClient';

/** Adds the structured reminder fields beside the stored sentence. */
export default Effect.gen(function* () {
	const sql = yield* SqlClient;
	yield* sql`
		alter table reminders
			add column borrower_name text not null default '',
			add column equipment_name text,
			add column equipment_code text
	`;
});
