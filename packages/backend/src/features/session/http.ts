import { Api, CurrentUser } from '@borrow-desk/api';
import * as HttpApiBuilder from 'effect/http-api/HttpApiBuilder';

/** Returns the person the bearer middleware already resolved. */
export const SessionLive = HttpApiBuilder.group(Api, 'session', (handlers) =>
	handlers.handle('getMe', () => CurrentUser),
);
