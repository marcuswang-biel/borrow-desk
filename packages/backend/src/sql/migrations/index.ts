import type * as Effect from 'effect/Effect';
import type { SqlClient } from 'effect/sql/SqlClient';

import equipment from './2026102401_equipment.ts';
import loans from './2026102402_loans.ts';
import reminders from './2026102403_reminders.ts';
import reminderFields from './2026103001_reminder_fields.ts';

/**
 * Migrations keyed by `<YYYYMMDDNN>_<name>`.
 * They are imported statically so Vercel bundles them into the serverless function.
 */
export const migrations: Record<string, Effect.Effect<void, unknown, SqlClient>> = {
	'2026102401_equipment': equipment,
	'2026102402_loans': loans,
	'2026102403_reminders': reminders,
	'2026103001_reminder_fields': reminderFields,
};
