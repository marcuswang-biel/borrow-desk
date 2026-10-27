import * as NodeServices from '@effect/platform-node/NodeServices';
import * as Effect from 'effect/Effect';
import * as HttpRouter from 'effect/http/HttpRouter';
import * as HttpServer from 'effect/http/HttpServer';
import * as Layer from 'effect/Layer';
import { timingSafeEqual } from 'node:crypto';

import { ApiLive, CronLive } from './app.ts';
import { scanOverdue } from './features/index.ts';

/** Path the scheduler calls to run the overdue scan. */
const cronPath = '/api/internal/overdue';

/**
 * Vercel fetch handler.
 * The reminder schedule is not started here; a scheduler calls the cron path.
 */
const app = HttpRouter.toWebHandler(
	ApiLive.pipe(Layer.provide(HttpServer.layerServices), Layer.provide(NodeServices.layer)),
);

/** The configured cron secret, or an empty string when the cron is disabled. */
const cronSecret = () => process.env.CRON_SECRET ?? '';

/** Constant-time comparison of the scheduler's bearer token. */
const authorized = (request: Request) => {
	const secret = cronSecret();
	const provided = request.headers.get('authorization') ?? '';
	const expected = `Bearer ${secret}`;
	return (
		secret.length >= 16 &&
		provided.length === expected.length &&
		timingSafeEqual(Buffer.from(provided), Buffer.from(expected))
	);
};

/** Runs the same overdue scan as the long-running server. */
const runOverdue = () =>
	Effect.runPromise(scanOverdue.pipe(Effect.provide(CronLive), Effect.provide(NodeServices.layer)));

/** Handles the scheduler request and runs the scan once. */
const handleCron = async (request: Request) => {
	if (cronSecret().length < 16) {
		return new Response('Cron is not configured', { status: 503 });
	}
	if (request.method !== 'GET' && request.method !== 'POST') {
		return new Response('Method not allowed', { status: 405 });
	}
	if (!authorized(request)) {
		return new Response('Unauthorized', { status: 401 });
	}
	try {
		await runOverdue();
		return Response.json({ ok: true });
	} catch (error) {
		console.error('Overdue scan failed', error);
		return new Response('Overdue scan failed', { status: 500 });
	}
};

/** Fetch function Vercel invokes for /api requests. */
export const fetch: (request: Request) => Promise<Response> = (request) =>
	new URL(request.url).pathname === cronPath ? handleCron(request) : app.handler(request);
