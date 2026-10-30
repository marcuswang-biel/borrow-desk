import { CurrentUser, Equipment, EquipmentCodeTaken, Forbidden } from '@borrow-desk/api';
import * as Context from 'effect/Context';
import * as DateTime from 'effect/DateTime';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import { EquipmentRepo } from '../../repo/index.ts';
import { requireAdmin } from './policy.ts';

/** Use cases for the equipment catalog. */
export class EquipmentService extends Context.Service<
	EquipmentService,
	{
		readonly list: () => Effect.Effect<ReadonlyArray<Equipment>>;
		readonly create: (input: {
			readonly name: string;
			readonly code: string;
		}) => Effect.Effect<Equipment, Forbidden | EquipmentCodeTaken, CurrentUser>;
	}
>()('borrow-desk/features/equipment/EquipmentService') {}

/** Catalog use cases over whatever EquipmentRepo is provided. */
export const EquipmentLive = Layer.effect(
	EquipmentService,
	Effect.gen(function* () {
		const repo = yield* EquipmentRepo;
		const list = repo.list;
		const create = Effect.fn('EquipmentService.create')(function* (input: {
			readonly name: string;
			readonly code: string;
		}) {
			const user = yield* CurrentUser;
			yield* requireAdmin(user);
			const item = new Equipment({
				id: globalThis.crypto.randomUUID(),
				name: input.name,
				code: input.code,
				createdAt: yield* DateTime.now,
			});
			const existing = yield* repo.insertIfNew(item);
			if (existing !== undefined) {
				return yield* new EquipmentCodeTaken({
					message: `${item.name} already has number ${item.code}`,
				});
			}
			return item;
		});
		return EquipmentService.of({ list, create });
	}),
);
