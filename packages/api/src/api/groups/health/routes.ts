import * as HttpApiEndpoint from 'effect/http-api/HttpApiEndpoint';
import * as Schema from 'effect/Schema';

/** Health payload. A successful response means PostgreSQL answered. */
const Health = Schema.Struct({
	status: Schema.Literal('ok'),
});

/** Unauthenticated database probe. */
export const getHealth = HttpApiEndpoint.get('getHealth', '/api/health', {
	success: Health,
});
