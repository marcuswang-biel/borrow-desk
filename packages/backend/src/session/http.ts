import { Api, CurrentUser } from '@borrow-desk/api';
import * as Effect from 'effect/Effect';
import * as HttpApiBuilder from 'effect/http-api/HttpApiBuilder';

export const SessionLive = HttpApiBuilder.group(Api, 'session', (handlers) =>
	Effect.gen(function* () {
		return handlers.handle('getMe', () => CurrentUser);
	}),
);
