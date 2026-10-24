import { Api } from '@borrow-desk/api';
import * as Effect from 'effect/Effect';
import * as HttpApiBuilder from 'effect/http-api/HttpApiBuilder';

import { EquipmentService } from './equipment.ts';

/** HTTP adapters for the equipment catalog. */
export const EquipmentHttpLive = HttpApiBuilder.group(Api, 'equipment', (handlers) =>
	Effect.gen(function* () {
		const equipment = yield* EquipmentService;
		return handlers
			.handle('listEquipment', () => equipment.list())
			.handle('createEquipment', ({ payload }) => equipment.create(payload));
	}),
);
