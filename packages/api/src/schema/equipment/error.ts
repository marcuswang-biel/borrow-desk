import * as Schema from 'effect/Schema';

/** This name already has a piece with this number. */
export class EquipmentCodeTaken extends Schema.TaggedError<EquipmentCodeTaken>()(
	'EquipmentCodeTaken',
	{ message: Schema.String },
	{ httpApiStatus: 409 },
) {}

/** The requested equipment id is not in the catalog. */
export class EquipmentNotFound extends Schema.TaggedError<EquipmentNotFound>()(
	'EquipmentNotFound',
	{ message: Schema.String },
	{ httpApiStatus: 404 },
) {}

/** Failures from recording or finding one piece of equipment. */
export type EquipmentError = EquipmentCodeTaken | EquipmentNotFound;
