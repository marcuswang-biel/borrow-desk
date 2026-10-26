import { HttpApiGroup } from 'effect/http-api';

import { Authentication } from '../../../auth.ts';
import { listReminders } from './routes.ts';

/** Reminder routes. */
export const RemindersGroup = HttpApiGroup.make('reminders')
	.add(listReminders)
	.middleware(Authentication);
