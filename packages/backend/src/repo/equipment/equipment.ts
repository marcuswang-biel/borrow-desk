import type { Equipment } from '@borrow-desk/api';
import type * as Effect from 'effect/Effect';

import * as Context from 'effect/Context';

/** Persistence port for the equipment catalog. */
export class EquipmentRepo extends Context.Service<
	EquipmentRepo,
	{
		readonly insertIfNew: (item: Equipment) => Effect.Effect<Equipment | undefined>;
		readonly list: () => Effect.Effect<ReadonlyArray<Equipment>>;
		readonly findById: (id: string) => Effect.Effect<Equipment | undefined>;
	}
>()('borrow-desk/repo/equipment/EquipmentRepo') {}
