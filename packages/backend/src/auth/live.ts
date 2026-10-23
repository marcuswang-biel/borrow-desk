import { Authentication, CurrentUser, Unauthorized } from '@borrow-desk/api';
import * as Config from 'effect/Config';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import * as Redacted from 'effect/Redacted';
import * as jose from 'jose';

export const AuthenticationLive = Layer.effect(
	Authentication,
	Effect.gen(function* () {
		const baseUrl = yield* Config.String('NEON_AUTH_BASE_URL');
		const issuer = new URL(baseUrl).origin;
		const jwks = jose.createRemoteJWKSet(
			new URL(`${baseUrl.replace(/\/$/, '')}/.well-known/jwks.json`),
		);
		return Authentication.of({
			bearer: (httpEffect, { credential }) =>
				Effect.gen(function* () {
					const token = Redacted.value(credential);
					if (token.length === 0) {
						return yield* new Unauthorized({ message: 'Missing bearer token' });
					}
					const verified = yield* Effect.tryPromise({
						try: () => jose.jwtVerify(token, jwks, { issuer }),
						catch: () => new Unauthorized({ message: 'Invalid bearer token' }),
					});
					const claims = verified.payload as {
						readonly sub?: string;
						readonly email?: string;
						readonly name?: string;
					};
					if (
						typeof claims.sub !== 'string' ||
						typeof claims.email !== 'string' ||
						typeof claims.name !== 'string'
					) {
						return yield* new Unauthorized({
							message: 'Bearer token is missing identity claims',
						});
					}
					return yield* Effect.provideService(httpEffect, CurrentUser, {
						id: claims.sub,
						email: claims.email,
						name: claims.name,
					});
				}),
		});
	}),
);
