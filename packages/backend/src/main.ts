import * as NodeHttpServer from '@effect/platform-node/NodeHttpServer';
import * as NodeRuntime from '@effect/platform-node/NodeRuntime';
import * as NodeServices from '@effect/platform-node/NodeServices';
import * as Config from 'effect/Config';
import * as HttpRouter from 'effect/http/HttpRouter';
import * as Layer from 'effect/Layer';
import { createServer } from 'node:http';

import { ServerLive } from './app.ts';

/** Node process that serves the API and keeps the reminder schedule running. */
const ListenLive = HttpRouter.serve(ServerLive).pipe(
	Layer.provide(NodeHttpServer.layerConfig(createServer, { port: Config.Port('PORT') })),
	Layer.provide(NodeServices.layer),
);

NodeRuntime.runMain(Layer.launch(ListenLive));
