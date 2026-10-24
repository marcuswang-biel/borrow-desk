import { Api } from '@borrow-desk/api';
import * as Effect from 'effect/Effect';
import * as HttpApiBuilder from 'effect/http-api/HttpApiBuilder';
import { SqlClient } from 'effect/sql/SqlClient';

/** Health handler. It answers only after PostgreSQL accepts `select 1`. */
export const HealthLive = HttpApiBuilder.group(Api, 'health', (handlers) =>
	Effect.gen(function* () {
		const sql = yield* SqlClient;
		return handlers.handle('getHealth', () =>
			sql`select 1`.pipe(
				Effect.map(() => ({ status: 'ok' as const })),
				Effect.orDie,
			),
		);
	}),
);
