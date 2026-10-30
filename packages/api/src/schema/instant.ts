import * as Schema from 'effect/Schema';

/** UTC instant. JSON and PostgreSQL store epoch milliseconds. */
export const Instant = Schema.DateTimeUtcFromMillis;
