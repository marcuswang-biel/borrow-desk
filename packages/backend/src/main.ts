import * as NodeHttpServer from '@effect/platform-node/NodeHttpServer';
import * as NodeRuntime from '@effect/platform-node/NodeRuntime';
import * as Config from 'effect/Config';
import * as HttpRouter from 'effect/http/HttpRouter';
import * as Layer from 'effect/Layer';
import { createServer } from 'node:http';

import { AppLive } from './app.ts';

const ServerLive = HttpRouter.serve(AppLive).pipe(
	Layer.provide(
		NodeHttpServer.layerConfig(createServer, {
			port: Config.Port('PORT'),
		}),
	),
);

Layer.launch(ServerLive).pipe(NodeRuntime.runMain);
