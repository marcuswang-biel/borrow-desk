import { Api, Authentication } from '@borrow-desk/api';
import * as Effect from 'effect/Effect';
import * as HttpApiClient from 'effect/http-api/HttpApiClient';
import * as HttpApiMiddleware from 'effect/http-api/HttpApiMiddleware';
import * as FetchHttpClient from 'effect/http/FetchHttpClient';
import * as HttpClientRequest from 'effect/http/HttpClientRequest';
import * as Layer from 'effect/Layer';
import * as ManagedRuntime from 'effect/ManagedRuntime';
import { authClient } from './auth.ts';

const AuthenticationClient = HttpApiMiddleware.layerClient(
	Authentication, 
	({ request, next }) =>
		Effect.gen(function* () {
			const issued = yield* Effect.tryPromise(() => authClient.token()).pipe(
				Effect.orElseSucceed(() => undefined)
			);
			const token = issued?.data?.token;
			const authed = 
				typeof token === 'string' && token.length > 0
					? HttpClientRequest.bearerToken(request, token)
					: request;
			return yield* next(authed);
		})
);
const runtime = ManagedRuntime.make(Layer.mergeAll(FetchHttpClient.layer, AuthenticationClient));

const makeClient = HttpApiClient.make(Api, {
	baseUrl: window.location.origin,
});

export const getHealth = () =>
	runtime.runPromise(
		Effect.gen(function* () {
			const api = yield* makeClient;
			return yield* api.health.getHealth();
		}),
	);

export const getMe = () =>
	runtime.runPromise(
		Effect.gen(function* () {
			const api = yield* makeClient;
			return yield* api.session.getMe();
		})
	)
