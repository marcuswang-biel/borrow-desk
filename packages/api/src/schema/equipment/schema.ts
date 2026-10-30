import * as Schema from 'effect/Schema';

import { Instant } from '../instant.ts';

/** A name or number with surrounding spaces removed. Empty text is rejected. */
export const RequiredText = Schema.Trim.pipe(Schema.decodeTo(Schema.NonEmptyString));

/** One piece of equipment an admin has recorded. `code` is its number within `name`. */
export class Equipment extends Schema.Class<Equipment>('Equipment')({
	id: Schema.String,
	name: RequiredText,
	code: RequiredText,
	createdAt: Instant,
}) {}

/** Body used to record a new piece of equipment. */
export class CreateEquipment extends Schema.Class<CreateEquipment>('CreateEquipment')({
	name: RequiredText,
	code: RequiredText,
}) {}
