import * as Schema from 'effect/Schema';

/** One piece of equipment an admin has recorded. `code` is its number within `name`. */
export const Equipment = Schema.Struct({
	id: Schema.String,
	name: Schema.String,
	code: Schema.String,
	createdAt: Schema.Number,
});

/** Body used to record a new piece of equipment. */
export const CreateEquipment = Schema.Struct({
	name: Schema.String,
	code: Schema.String,
});

/** Equipment value returned by the API. */
export type Equipment = typeof Equipment.Type;
/** Create-equipment payload. */
export type CreateEquipment = typeof CreateEquipment.Type;
