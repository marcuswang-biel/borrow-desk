import * as HttpRouter from 'effect/http/HttpRouter';
import * as HttpServer from 'effect/http/HttpServer';
import * as Layer from 'effect/Layer';

import { AppLive } from '../packages/backend/src/app.ts';

const app = HttpRouter.toWebHandler(AppLive.pipe(Layer.provide(HttpServer.layerServices)));

export default {
	fetch(request: Request) {
		return app.handler(request);
	},
};
