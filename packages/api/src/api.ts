import * as HttpApi from 'effect/http-api/HttpApi';

import { HealthGroup } from './health/group.ts';
import { SessionGroup } from './session/group.ts';
export { Authentication } from './auth/middleware.ts';
export { CurrentUser, User } from './auth/current-user.ts';
export { Unauthorized } from './auth/error.ts';

export const Api = HttpApi.make('borrow-desk').add(HealthGroup).add(SessionGroup);
