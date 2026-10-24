import * as Effect from 'effect/Effect';
import { SqlClient } from 'effect/sql/SqlClient';

/** Creates the loan ledger. */
export default Effect.gen(function* () {
	const sql = yield* SqlClient;
	yield* sql`
		create table loans (
			id text primary key,
			equipment_id text not null references equipment (id),
			borrower_id text not null,
			borrower_name text not null,
			starts_at bigint not null,
			ends_at bigint not null,
			returned_at bigint
		)
	`;
});
