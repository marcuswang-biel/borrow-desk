import { Authentication, CurrentUser, Unauthorized, type Role } from '@borrow-desk/api';
import * as Config from 'effect/Config';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import * as Redacted from 'effect/Redacted';
import * as jose from 'jose';

/** Public origin Better Auth prints into the token, and the browser uses for cookies. */
const publicOrigin = Config.String('AUTH_PUBLIC_URL');

/** Email that is treated as admin. Everyone else is an employee. */
const adminEmail = Config.String('ADMIN_EMAIL').pipe(Config.withDefault(''));

/** Port of this API process, used to fetch its own JWKS without leaving the machine. */
const port = Config.Port('PORT');

/** Decides the role from the admin email, ignoring case. */
const roleFor = (email: string, admin: string): Role =>
	admin.length > 0 && email.toLowerCase() === admin.toLowerCase() ? 'admin' : 'employee';

/** Verifies bearer tokens from this process's Better Auth JWKS. */
export const AuthenticationLive = Layer.effect(
	Authentication,
	Effect.gen(function* () {
		const origin = yield* publicOrigin;
		const admin = yield* adminEmail;
		const apiPort = yield* port;
		const appEnv = yield* Config.Literals(['development', 'production'], 'APP_ENV');
		const jwksUrl =
			appEnv === 'development'
				? `http://127.0.0.1:${apiPort}/api/auth/jwks`
				: `${origin.replace(/\/$/, '')}/api/auth/jwks`;
		const jwks = jose.createRemoteJWKSet(new URL(jwksUrl));
		return Authentication.of({
			bearer: (httpEffect, { credential }) =>
				Effect.gen(function* () {
					const token = Redacted.value(credential);
					if (token.length === 0) {
						return yield* new Unauthorized({ message: 'Missing bearer token' });
					}
					const verified = yield* Effect.tryPromise({
						try: () => jose.jwtVerify(token, jwks, { issuer: origin }),
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
						return yield* new Unauthorized({ message: 'Bearer token is missing identity claims' });
					}
					return yield* Effect.provideService(httpEffect, CurrentUser, {
						id: claims.sub,
						email: claims.email,
						name: claims.name,
						role: roleFor(claims.email, admin),
					});
				}),
		});
	}),
);
