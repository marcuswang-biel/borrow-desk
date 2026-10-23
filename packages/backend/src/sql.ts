import * as PgClient from '@effect/sql-pg/PgClient';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import { assertDatabaseEnv, DatabaseEnv } from './database-env.ts';

export const SqlLive = Layer.unwrap(
	Effect.gen(function* () {
		const config = yield* DatabaseEnv;
		yield* assertDatabaseEnv(config);
		return PgClient.layer({
			url: config.url,
			prepare: config.prepare,
			maxConnections: config.maxConnections,
			idleTimeout: config.idleTimeout,
		});
	}),
);
