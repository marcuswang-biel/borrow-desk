import type { Equipment } from '@borrow-desk/api';

import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import { SqlClient } from 'effect/sql/SqlClient';

import { EquipmentRepo } from './equipment.ts';

/** One equipment row as PostgreSQL returns it. */
interface EquipmentRow {
	readonly id: string;
	readonly name: string;
	readonly code: string;
	readonly created_at: string | number;
}

/** Maps a database row onto the shared equipment schema. */
const toEquipment = (row: EquipmentRow): Equipment => ({
	id: row.id,
	name: row.name,
	code: row.code,
	createdAt: Number(row.created_at),
});

/** Catalog backed by the equipment table. */
export const EquipmentRepoSql = Layer.effect(
	EquipmentRepo,
	Effect.gen(function* () {
		const sql = yield* SqlClient;
		return {
			insert: (item) =>
				sql`insert into equipment (id, name, code, created_at) values (${item.id}, ${item.name}, ${item.code}, ${item.createdAt})`.pipe(
					Effect.asVoid,
					Effect.orDie,
				),
			list: () =>
				sql<EquipmentRow>`select id, name, code, created_at from equipment order by name, code`.pipe(
					Effect.map((rows) => rows.map(toEquipment)),
					Effect.orDie,
				),
			findById: (id) =>
				sql<EquipmentRow>`select id, name, code, created_at from equipment where id = ${id}`.pipe(
					Effect.map((rows) => {
						const row = rows[0];
						return row === undefined ? undefined : toEquipment(row);
					}),
					Effect.orDie,
				),
			findByNameAndCode: (name, code) =>
				sql<EquipmentRow>`select id, name, code, created_at from equipment where name = ${name} and code = ${code}`.pipe(
					Effect.map((rows) => {
						const row = rows[0];
						return row === undefined ? undefined : toEquipment(row);
					}),
					Effect.orDie,
				),
		};
	}),
);
