import * as HttpApiEndpoint from 'effect/http-api/HttpApiEndpoint';

import { User } from '../../../schema/user/index.ts';

/** Signed-in caller's identity. */
export const getMe = HttpApiEndpoint.get('getMe', '/api/me', {
	success: User,
});
