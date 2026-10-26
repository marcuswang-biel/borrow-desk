import * as HttpApiEndpoint from 'effect/http-api/HttpApiEndpoint';
import * as Schema from 'effect/Schema';

import { CreateEquipment, Equipment, EquipmentCodeTaken } from '../../../schema/equipment/index.ts';
import { Forbidden } from '../../../schema/user/index.ts';

/** Catalog of equipment. */
export const listEquipment = HttpApiEndpoint.get('listEquipment', '/api/equipment', {
	success: Schema.Array(Equipment),
});

/** Admin records one piece of equipment. */
export const createEquipment = HttpApiEndpoint.post('createEquipment', '/api/equipment', {
	payload: CreateEquipment,
	success: Equipment,
	error: [Forbidden, EquipmentCodeTaken],
});
