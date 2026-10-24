import * as Effect from 'effect/Effect';
import { SqlClient } from 'effect/sql/SqlClient';

/** Creates the equipment catalog. */
export default Effect.gen(function* () {
	const sql = yield* SqlClient;
	yield* sql`
		create table equipment (
			id text primary key,
			name text not null,
			code text not null,
			created_at bigint not null,
			unique (name, code)
		)
	`;
});
