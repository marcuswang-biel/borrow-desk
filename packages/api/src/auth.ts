import * as Context from 'effect/Context';
import { HttpApiMiddleware, HttpApiSecurity } from 'effect/http-api';

import { Unauthorized, type User } from './schema/user/index.ts';

/** Signed-in person provided to handlers by the bearer middleware. */
export class CurrentUser extends Context.Service<CurrentUser, User>()('borrow-desk/CurrentUser') {}

/** Requires a bearer token and provides CurrentUser to the handler. */
export class Authentication extends HttpApiMiddleware.Service<
	Authentication,
	{ provides: CurrentUser; requires: never }
>()('borrow-desk/Authentication', {
	requiredForClient: false,
	security: {
		bearer: HttpApiSecurity.bearer,
	},
	error: Unauthorized,
}) {}
