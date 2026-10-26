import { Api } from '@borrow-desk/api';
import * as Effect from 'effect/Effect';
import * as HttpApiBuilder from 'effect/http-api/HttpApiBuilder';

import { RemindersService } from './reminders.ts';

/** HTTP adapter for the signed-in borrower's reminders. */
export const RemindersHttpLive = HttpApiBuilder.group(Api, 'reminders', (handlers) =>
	Effect.gen(function* () {
		const reminders = yield* RemindersService;
		return handlers.handle('listReminders', () => reminders.list());
	}),
);
