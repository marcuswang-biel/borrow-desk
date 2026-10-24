import * as PgClient from '@effect/sql-pg/PgClient';
import * as Config from 'effect/Config';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import * as Redacted from 'effect/Redacted';

/** Hosts that mean the process is talking to a database on this machine. */
const localHosts = new Set(['localhost', '127.0.0.1', '::1']);

/** Parsed pool settings for one environment. */
export interface DatabaseEnv {
	readonly appEnv: 'development' | 'production';
	readonly url: Redacted.Redacted;
	readonly prepare: boolean;
	readonly maxConnections: number;
	readonly idleTimeout: string;
}

/** Reads DATABASE_URL and refuses a development process pointed at Neon, or the reverse. */
export const DatabaseEnv = Config.all({
	appEnv: Config.Literals(['development', 'production'], 'APP_ENV'),
	url: Config.Redacted('DATABASE_URL'),
	prepare: Config.Boolean('PG_PREPARE'),
	maxConnections: Config.Int('PG_MAX_CONNECTIONS'),
	idleTimeout: Config.String('PG_IDLE_TIMEOUT'),
});

/** Dies when the URL host does not match the environment rules. */
export const assertDatabaseEnv = (env: DatabaseEnv) => {
	const databaseUrl = Redacted.value(env.url);
	const host = databaseUrl.length === 0 ? '' : new URL(databaseUrl).hostname;
	const local = localHosts.has(host);
	const pooler =
		(host.endsWith('.neon.tech') || host.endsWith('.neon.build')) && host.includes('-pooler');
	if (env.appEnv === 'development' && (!local || pooler)) {
		return Effect.die(new Error('development must use local PostgreSQL'));
	}
	if (env.appEnv === 'production' && (local || !pooler)) {
		return Effect.die(new Error('production must use the Neon pooler'));
	}
	if (env.appEnv === 'development' && (!env.prepare || env.maxConnections !== 10)) {
		return Effect.die(new Error('development pool settings must stay prepare=true and max=10'));
	}
	if (env.appEnv === 'production' && (env.prepare || env.maxConnections !== 1)) {
		return Effect.die(new Error('production pool settings must stay prepare=false and max=1'));
	}
	return Effect.void;
};

/** PostgreSQL client for the environment selected by APP_ENV. */
export const SqlLive = Layer.unwrap(
	Effect.gen(function* () {
		const env = yield* DatabaseEnv;
		yield* assertDatabaseEnv(env);
		return PgClient.layer({
			url: env.url,
			prepare: env.prepare,
			maxConnections: env.maxConnections,
			idleTimeout: env.appEnv === 'development' ? '30 seconds' : '10 seconds',
		});
	}),
);
