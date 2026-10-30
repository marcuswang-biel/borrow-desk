import * as DateTime from 'effect/DateTime';
import * as Schema from 'effect/Schema';
import * as SchemaGetter from 'effect/SchemaGetter';
import * as SchemaTransformation from 'effect/SchemaTransformation';

/** Turns epoch milliseconds into a UTC instant and back. */
const toInstant = {
	decode: SchemaGetter.transform((value: number) => DateTime.makeUnsafe(value)),
	encode: SchemaGetter.transform(DateTime.toEpochMillis),
};

/** Epoch milliseconds as PostgreSQL returns them, decoded to a UTC instant. */
export const DbInstant = Schema.Union([
	Schema.Number.pipe(Schema.decodeTo(Schema.DateTimeUtc, toInstant)),
	Schema.String.pipe(
		Schema.decodeTo(Schema.Number, SchemaTransformation.numberFromString),
		Schema.decodeTo(Schema.DateTimeUtc, toInstant),
	),
]);

/** Nullable epoch milliseconds from PostgreSQL. */
export const DbInstantOrNull = Schema.NullOr(DbInstant);

/** Milliseconds stored in a bigint column. */
export const millis = DateTime.toEpochMillis;
