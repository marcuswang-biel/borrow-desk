import { betterAuth } from 'better-auth';
import { getMigrations } from 'better-auth/db/migration';
import { jwt } from 'better-auth/plugins';
import * as Config from 'effect/Config';
import * as Effect from 'effect/Effect';
import * as HttpRouter from 'effect/http/HttpRouter';
import * as HttpServerRequest from 'effect/http/HttpServerRequest';
import * as HttpServerResponse from 'effect/http/HttpServerResponse';
import * as Layer from 'effect/Layer';
import * as Redacted from 'effect/Redacted';
import { Pool } from 'pg';

/** Better Auth base path. The Vite dev server proxies this prefix to the API. */
const authPath = '/api/auth';

/** Hosts allowed for the development database. */
const localHosts = new Set(['localhost', '127.0.0.1', '::1']);

/** Development-only signing secret. Production reads BETTER_AUTH_SECRET instead. */
const developmentSecret = 'borrow-desk-local-development-secret';

/** Mounts Better Auth on /api/auth and creates its tables in the current database. */
export const BetterAuthLive = Layer.unwrap(
	Effect.gen(function* () {
		const appEnv = yield* Config.Literals(['development', 'production'], 'APP_ENV');
		const databaseUrl = Redacted.value(yield* Config.Redacted('DATABASE_URL'));
		const origin = yield* Config.String('AUTH_PUBLIC_URL');
		const host = new URL(databaseUrl).hostname;
		if (appEnv === 'development' && !localHosts.has(host)) {
			return yield* Effect.die(new Error('development Better Auth must use local PostgreSQL'));
		}
		const configuredSecret = yield* Config.String('BETTER_AUTH_SECRET').pipe(
			Config.withDefault(''),
		);
		const secret = appEnv === 'development' ? developmentSecret : configuredSecret;
		if (secret.length < 16) {
			return yield* Effect.die(new Error('production requires BETTER_AUTH_SECRET'));
		}
		const auth = betterAuth({
			database: new Pool({
				connectionString: databaseUrl,
				max: appEnv === 'production' ? 1 : 10,
				idleTimeoutMillis: appEnv === 'production' ? 10_000 : 30_000,
			}),
			baseURL: origin,
			basePath: authPath,
			secret,
			trustedOrigins: [origin],
			emailAndPassword: { enabled: true },
			plugins: [jwt()],
		});
		const migrations = yield* Effect.tryPromise(() => getMigrations(auth.options)).pipe(
			Effect.orDie,
		);
		yield* Effect.tryPromise(() => migrations.runMigrations()).pipe(Effect.orDie);
		return HttpRouter.use((router) =>
			router.addGlobalMiddleware((effect) =>
				Effect.gen(function* () {
					const request = yield* HttpServerRequest.HttpServerRequest;
					const pathname = new URL(request.url, origin).pathname;
					if (!pathname.startsWith(authPath)) {
						return yield* effect;
					}
					const webRequest = yield* HttpServerRequest.toWeb(request);
					const response = yield* Effect.tryPromise(() => auth.handler(webRequest)).pipe(
						Effect.orDie,
					);
					return HttpServerResponse.fromWeb(response);
				}),
			),
		);
	}),
);
