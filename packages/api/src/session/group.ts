import * as HttpApiEndpoint from 'effect/http-api/HttpApiEndpoint';
import * as HttpApiGroup from 'effect/http-api/HttpApiGroup';

import { User } from '../auth/current-user.ts';
import { Authentication } from '../auth/middleware.ts';

export const getMe = HttpApiEndpoint.get('getMe', '/api/me', {
	success: User,
});

export const SessionGroup = HttpApiGroup.make('session').add(getMe).middleware(Authentication);
