import { Api } from '@borrow-desk/api';
import * as HttpApiBuilder from 'effect/http-api/HttpApiBuilder';
import * as Layer from 'effect/Layer';

import { AuthenticationLive } from './auth/live.ts';
import { HealthLive } from './health/http.ts';
import { SessionLive } from './session/http.ts';
import { SqlLive } from './sql.ts';

export const AppLive = HttpApiBuilder.layer(Api).pipe(
	Layer.provide(HealthLive),
	Layer.provide(SessionLive),
	Layer.provide(AuthenticationLive),
	Layer.provide(SqlLive),
);
