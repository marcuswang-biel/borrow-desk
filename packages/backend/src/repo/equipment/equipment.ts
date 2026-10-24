import type { Equipment } from '@borrow-desk/api';
import type * as Effect from 'effect/Effect';

import * as Context from 'effect/Context';

/** Persistence port for the equipment catalog. */
export const EquipmentRepo = Context.Service<{
	readonly insert: (item: Equipment) => Effect.Effect<void>;
	readonly list: () => Effect.Effect<ReadonlyArray<Equipment>>;
	readonly findById: (id: string) => Effect.Effect<Equipment | undefined>;
	readonly findByNameAndCode: (name: string, code: string) => Effect.Effect<Equipment | undefined>;
}>('borrow-desk/EquipmentRepo');
