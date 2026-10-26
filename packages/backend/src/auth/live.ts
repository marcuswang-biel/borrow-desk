import { Authentication, CurrentUser, Unauthorized, type Role } from '@borrow-desk/api';
import * as Config from 'effect/Config';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import * as Redacted from 'effect/Redacted';
import * as jose from 'jose';

/** Public origin Better Auth prints into the token, and the browser uses for cookies. */
const publicOrigin = Config.String('AUTH_PUBLIC_URL');

/** Admin addresses from ADMIN_EMAIL. Separate several addresses with commas. */
const adminEmails = Config.String('ADMIN_EMAIL').pipe(Config.withDefault(''));

/** Port of the local API process, used only outside Vercel's fetch handler. */
const port = Config.Port('PORT');

/** Splits a comma-separated admin list and keeps each address in lower case. */
const adminSet = (value: string): ReadonlySet<string> =>
	new Set(
		value
			.split(',')
			.map((email) => email.trim().toLowerCase())
			.filter((email) => email.length > 0),
	);

/** Decides the role from the admin list, ignoring case. */
const roleFor = (email: string, admins: ReadonlySet<string>): Role =>
	admins.has(email.toLowerCase()) ? 'admin' : 'employee';

/** Verifies bearer tokens from this process's Better Auth JWKS. */
export const AuthenticationLive = Layer.effect(
	Authentication,
	Effect.gen(function* () {
		const origin = yield* publicOrigin;
		const admins = adminSet(yield* adminEmails);
		const appEnv = yield* Config.Literals(['development', 'production'], 'APP_ENV');
		let jwksUrl: string;
		if (appEnv === 'development') {
			const apiPort = yield* port;
			jwksUrl = `http://127.0.0.1:${apiPort}/api/auth/jwks`;
		} else {
			jwksUrl = `${origin.replace(/\/$/, '')}/api/auth/jwks`;
		}
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
						role: roleFor(claims.email, admins),
					});
				}),
		});
	}),
);
