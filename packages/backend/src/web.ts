import * as HttpRouter from 'effect/http/HttpRouter';
import * as HttpServer from 'effect/http/HttpServer';
import * as Layer from 'effect/Layer';

import { AppLive } from './app.ts';

const app = HttpRouter.toWebHandler(AppLive.pipe(Layer.provide(HttpServer.layerServices)));

export const fetch = (request: Request) => app.handler(request);
