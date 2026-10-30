import { Equipment } from '@borrow-desk/api';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import * as Schema from 'effect/Schema';
import { SqlClient } from 'effect/sql/SqlClient';
import * as SqlSchema from 'effect/sql/SqlSchema';

import { asDefect } from '../../sql/defect.ts';
import { DbMillis, millis } from '../../sql/instant.ts';
import { EquipmentRepo } from './equipment.ts';

/** Equipment row as PostgreSQL returns it, decoded once into the catalog item. */
const EquipmentFromRow = Schema.Struct({
	id: Schema.String,
	name: Schema.String,
	code: Schema.String,
	createdAt: DbMillis,
}).pipe(Schema.decodeTo(Equipment));

/** Catalog backed by the equipment table. */
export const EquipmentRepoSql = Layer.effect(
	EquipmentRepo,
	Effect.gen(function* () {
		const sql = yield* SqlClient;
		const read = SqlSchema.findAll({
			Request: Schema.Void,
			Result: EquipmentFromRow,
			execute: () =>
				sql`select id, name, code, created_at::float8 as "createdAt" from equipment order by name, code`,
		});
		const findByIdQuery = SqlSchema.findAll({
			Request: Schema.String,
			Result: EquipmentFromRow,
			execute: (id) =>
				sql`select id, name, code, created_at::float8 as "createdAt" from equipment where id = ${id}`,
		});
		const findByNameQuery = SqlSchema.findAll({
			Request: Schema.Struct({ name: Schema.String, code: Schema.String }),
			Result: EquipmentFromRow,
			execute: (request) =>
				sql`select id, name, code, created_at::float8 as "createdAt" from equipment where name = ${request.name} and code = ${request.code}`,
		});
		const findById = Effect.fn('EquipmentRepo.findById')(function* (id: string) {
			const rows = yield* findByIdQuery(id);
			return rows[0];
		}, asDefect);

		const findByNameAndCode = Effect.fn('EquipmentRepo.findByNameAndCode')(function* (
			name: string,
			code: string,
		) {
			const rows = yield* findByNameQuery({ name, code });
			return rows[0];
		}, asDefect);

		const insertIfNew = Effect.fn('EquipmentRepo.insertIfNew')(function* (item: Equipment) {
			return yield* sql.withTransaction(
				Effect.gen(function* () {
					const existing = yield* findByNameAndCode(item.name, item.code);
					if (existing !== undefined) {
						return existing;
					}
					yield* sql`insert into equipment (id, name, code, created_at) values (${item.id}, ${item.name}, ${item.code}, ${millis(item.createdAt)})`;
					return undefined;
				}),
			);
		}, asDefect);

		const list = Effect.fn('EquipmentRepo.list')(function* () {
			return yield* read();
		}, asDefect);

		return EquipmentRepo.of({ insertIfNew, list, findById });
	}),
);
