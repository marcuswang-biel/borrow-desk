import * as Effect from 'effect/Effect';
import * as FetchHttpClient from 'effect/http/FetchHttpClient';
import * as HttpClient from 'effect/http/HttpClient';
import * as HttpClientRequest from 'effect/http/HttpClientRequest';
import * as Layer from 'effect/Layer';

import { sessionToken } from '../auth/auth-client.ts';

/** Fetch client that reads the Better Auth JWT on each request. */
export const authedClient = Layer.effect(
	HttpClient.HttpClient,
	Effect.gen(function* () {
		const client = yield* HttpClient.HttpClient;
		return HttpClient.mapRequestEffect(client, (request) =>
			Effect.map(sessionToken.pipe(Effect.orElseSucceed(() => undefined)), (token) =>
				token === undefined ? request : HttpClientRequest.bearerToken(request, token),
			),
		);
	}),
).pipe(Layer.provide(FetchHttpClient.layer));

/** Provides the fetch client and runs the effect. The effect may only require that client. */
export const run = <A, E>(effect: Effect.Effect<A, E, HttpClient.HttpClient>) =>
	Effect.runPromise(effect.pipe(Effect.provide(authedClient)));
