import { CurrentUser, type Equipment, EquipmentCodeTaken, Forbidden } from '@borrow-desk/api';
import * as Clock from 'effect/Clock';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import { EquipmentRepo } from '../../repo/index.ts';
import { requireAdmin } from './policy.ts';

/** Use cases for the equipment catalog. */
export const EquipmentService = Context.Service<{
	readonly list: () => Effect.Effect<ReadonlyArray<Equipment>>;
	readonly create: (input: {
		readonly name: string;
		readonly code: string;
	}) => Effect.Effect<Equipment, Forbidden | EquipmentCodeTaken, CurrentUser>;
}>('borrow-desk/EquipmentService');

/** Catalog use cases over whatever EquipmentRepo is provided. */
export const EquipmentLive = Layer.effect(
	EquipmentService,
	Effect.gen(function* () {
		const repo = yield* EquipmentRepo;
		return {
			list: () => repo.list(),
			create: (input) =>
				Effect.gen(function* () {
					const user = yield* CurrentUser;
					const name = input.name.trim();
					const code = input.code.trim();
					yield* requireAdmin(user);
					if (name.length === 0) {
						return yield* new Forbidden({ message: 'Equipment name is empty' });
					}
					if (code.length === 0) {
						return yield* new Forbidden({ message: 'Equipment number is empty' });
					}
					const existing = yield* repo.findByNameAndCode(name, code);
					if (existing !== undefined) {
						return yield* new EquipmentCodeTaken({
							message: `${name} already has number ${code}`,
						});
					}
					const createdAt = yield* Clock.currentTimeMillis;
					const item: Equipment = {
						id: crypto.randomUUID(),
						name,
						code,
						createdAt,
					};
					yield* repo.insert(item);
					return item;
				}),
		};
	}),
);
