import * as Config from 'effect/Config';
import * as Duration from 'effect/Duration';
import * as Effect from 'effect/Effect';
import * as Redacted from 'effect/Redacted';

const localHosts = new Set(['localhost', '127.0.0.1', '::1']);

export const DatabaseEnv = Config.all({
	appEnv: Config.Literals(['development', 'production'], 'APP_ENV'),
	url: Config.Redacted('DATABASE_URL'),
	prepare: Config.Boolean('PG_PREPARE'),
	maxConnections: Config.Int('PG_MAX_CONNECTIONS'),
	idleTimeout: Config.Duration('PG_IDLE_TIMEOUT'),
});

const reject = (message: string) => Effect.die(new Error(message));

export const assertDatabaseEnv = (
	config: Config.Success<typeof DatabaseEnv>,
): Effect.Effect<void> => {
	const databaseUrl = Redacted.value(config.url);
	if (databaseUrl.length === 0) {
		return reject('DATABASE_URL is empty');
	}

	const host = new URL(databaseUrl).hostname;
	const local = localHosts.has(host);
	const neonPooler =
		(host.endsWith('.neon.tech') || host.endsWith('.neon.build')) && host.includes('-pooler');
	const idleMs = Duration.toMillis(config.idleTimeout);

	if (config.appEnv === 'development') {
		if (
			!local ||
			neonPooler ||
			config.prepare !== true ||
			config.maxConnections !== 10 ||
			idleMs !== 30_000
		) {
			return reject(
				'development must use local PostgreSQL with PG_PREPARE=true, PG_MAX_CONNECTIONS=10, and PG_IDLE_TIMEOUT=30 seconds',
			);
		}
		return Effect.void;
	}

	if (
		local ||
		!neonPooler ||
		config.prepare !== false ||
		config.maxConnections !== 1 ||
		idleMs !== 10_000
	) {
		return reject(
			'production must use a Neon pooler with PG_PREPARE=false, PG_MAX_CONNECTIONS=1, and PG_IDLE_TIMEOUT=10 seconds',
		);
	}
	return Effect.void;
};
