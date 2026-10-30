import * as DateTime from 'effect/DateTime';
import * as Schema from 'effect/Schema';
import * as SchemaGetter from 'effect/SchemaGetter';
import * as SchemaTransformation from 'effect/SchemaTransformation';

/** Turns a PostgreSQL bigint into a JavaScript number and back. */
const bigintToNumber = {
	decode: SchemaGetter.transform((value: bigint) => Number(value)),
	encode: SchemaGetter.transform((value: number) => BigInt(value)),
};

/**
 * Epoch milliseconds as PostgreSQL returns them.
 * A float cast is a number, a bigint column is a bigint, and some clients send a numeric string.
 */
export const DbMillis = Schema.Union([
	Schema.Number,
	Schema.String.pipe(Schema.decodeTo(Schema.Number, SchemaTransformation.numberFromString)),
	Schema.BigInt.pipe(Schema.decodeTo(Schema.Number, bigintToNumber)),
]);

/** Nullable epoch milliseconds from PostgreSQL. */
export const DbMillisOrNull = Schema.NullOr(DbMillis);

/** Milliseconds stored in a bigint column. */
export const millis = DateTime.toEpochMillis;
