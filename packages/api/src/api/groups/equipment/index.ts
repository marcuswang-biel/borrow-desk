import { HttpApiGroup } from 'effect/http-api';

import { Authentication } from '../../../auth.ts';
import { createEquipment, listEquipment } from './routes.ts';

/** Equipment catalog routes. */
export const EquipmentGroup = HttpApiGroup.make('equipment')
	.add(listEquipment)
	.add(createEquipment)
	.middleware(Authentication);
