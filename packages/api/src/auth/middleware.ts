import { HttpApiMiddleware, HttpApiSecurity } from 'effect/http-api';

import type { CurrentUser } from './current-user.ts';

import { Unauthorized } from './error.ts';

export class Authentication extends HttpApiMiddleware.Service<
	Authentication,
	{ provides: CurrentUser; requires: never }
>()('borrow-desk/Authentication', {
	requiredForClient: true,
	security: {
		bearer: HttpApiSecurity.bearer,
	},
	error: Unauthorized,
}) {}
