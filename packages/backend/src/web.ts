import * as NodeServices from '@effect/platform-node/NodeServices';
import * as HttpRouter from 'effect/http/HttpRouter';
import * as HttpServer from 'effect/http/HttpServer';
import * as Layer from 'effect/Layer';

import { ApiLive } from './app.ts';

/**
 * Vercel fetch handler.
 * The reminder schedule is not started here; a cron calls the same scan on the long-running path.
 */
const app = HttpRouter.toWebHandler(
	ApiLive.pipe(Layer.provide(HttpServer.layerServices), Layer.provide(NodeServices.layer)),
);

/** Fetch function Vercel invokes for /api requests. */
export const fetch = (request: Request) => app.handler(request);
