import { Api } from '@borrow-desk/api';
import * as NodeHttpServer from '@effect/platform-node/NodeHttpServer';
import * as NodeRuntime from '@effect/platform-node/NodeRuntime';
import * as Config from 'effect/Config';
import * as HttpApiBuilder from 'effect/http-api/HttpApiBuilder';
import * as HttpRouter from 'effect/http/HttpRouter';
import * as Layer from 'effect/Layer';
import { createServer } from 'node:http';

import { AuthenticationLive } from './auth/live.ts';
import { HealthLive } from './health/http.ts';
import { SessionLive } from './session/http.ts';
import { SqlLive } from './sql.ts';

const AppLive = HttpApiBuilder.layer(Api).pipe(
	Layer.provide(HealthLive),
	Layer.provide(SessionLive),
	Layer.provide(AuthenticationLive),
	Layer.provide(SqlLive),
);

const ServerLive = HttpRouter.serve(AppLive).pipe(
	Layer.provide(
		NodeHttpServer.layerConfig(createServer, {
			port: Config.Port('PORT'),
		}),
	),
);

Layer.launch(ServerLive).pipe(NodeRuntime.runMain);
