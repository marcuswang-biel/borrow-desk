import { assert, it } from '@effect/vitest';
import * as DateTime from 'effect/DateTime';
import * as Effect from 'effect/Effect';
import * as Schema from 'effect/Schema';

import { LoanFromRow } from '../src/repo/loans/loans-sql.ts';

/** The two loan rows currently stored, with timestamps as numeric strings. */
const stored = [
	{
		id: '735e6b28-1de6-4be4-a0f6-2db061e75e37',
		equipmentId: 'c2d0bef7-3378-4ebd-b295-ef5f5ee9c169',
		borrowerId: 'WaCn8mP5SkTS31uJPOeXqNCK3I9El72q',
		borrowerName: '123',
		startsAt: '1793327880000',
		endsAt: '1793414280000',
		returnedAt: '1793327917562',
	},
	{
		id: '9f74447c-393b-48e6-83d0-8fcb7c514776',
		equipmentId: 'c2d0bef7-3378-4ebd-b295-ef5f5ee9c169',
		borrowerId: 'fVVIiGRswwwhp4nkTYYgKRFIbGjVIPAA',
		borrowerName: 'admin',
		startsAt: '1793337120000',
		endsAt: '1793337240000',
		returnedAt: null,
	},
] as const;

/** Reads one stored loan whether the driver returns a string, a bigint, or a number. */
const read = (row: {
	readonly id: string;
	readonly equipmentId: string;
	readonly borrowerId: string;
	readonly borrowerName: string;
	readonly startsAt: string | bigint | number;
	readonly endsAt: string | bigint | number;
	readonly returnedAt: string | bigint | number | null;
}) => Schema.decodeUnknownEffect(LoanFromRow)(row);

it.effect('reads stored loan timestamps', () =>
	Effect.gen(function* () {
		const [returned, open] = yield* Effect.all([read(stored[0]), read(stored[1])]);
		assert.strictEqual(DateTime.toEpochMillis(returned.startsAt), 1793327880000);
		assert.strictEqual(DateTime.toEpochMillis(returned.endsAt), 1793414280000);
		assert.strictEqual(
			returned.returnedAt === null ? null : DateTime.toEpochMillis(returned.returnedAt),
			1793327917562,
		);
		assert.strictEqual(open.returnedAt, null);
		const asBigint = yield* read({
			...stored[1],
			startsAt: 1793337120000n,
			endsAt: 1793337240000n,
		});
		const asNumber = yield* read({
			...stored[1],
			startsAt: 1793337120000,
			endsAt: 1793337240000,
		});
		assert.strictEqual(DateTime.toEpochMillis(asBigint.startsAt), 1793337120000);
		assert.strictEqual(DateTime.toEpochMillis(asNumber.endsAt), 1793337240000);
	}),
);
