import { execFileSync } from 'node:child_process';
import { chmodSync, existsSync, readFileSync, writeFileSync } from 'node:fs';

const localHosts = new Set(['localhost', '127.0.0.1', '::1']);

const parseEnv = (text) => {
	const values = {};
	for (const line of text.split('\n')) {
		const trimmed = line.trim();
		if (trimmed.length === 0 || trimmed.startsWith('#')) {
			continue;
		}
		const separator = trimmed.indexOf('=');
		if (separator < 0) {
			continue;
		}
		const key = trimmed.slice(0, separator).trim();
		let value = trimmed.slice(separator + 1).trim();
		if (
			(value.startsWith('"') && value.endsWith('"')) ||
			(value.startsWith("'") && value.endsWith("'"))
		) {
			value = value.slice(1, -1);
		}
		values[key] = value;
	}
	return values;
};

const formatEntry = (key, value) => {
	if (value.length === 0) {
		return `${key}=`;
	}
	if (/[\s#"']/.test(value)) {
		return `${key}=${JSON.stringify(value)}`;
	}
	return `${key}=${value}`;
};

const writeEnv = (path, entries) => {
	const body = `${entries.map(([key, value]) => formatEntry(key, value)).join('\n')}\n`;
	writeFileSync(path, body, { mode: 0o600 });
	chmodSync(path, 0o600);
};

const readEnv = (path) => (existsSync(path) ? parseEnv(readFileSync(path, 'utf8')) : {});

const hostnameOf = (databaseUrl) => new URL(databaseUrl).hostname;

const isLocal = (databaseUrl) => localHosts.has(hostnameOf(databaseUrl));

const isNeonPooler = (databaseUrl) => {
	const host = hostnameOf(databaseUrl);
	return (host.endsWith('.neon.tech') || host.endsWith('.neon.build')) && host.includes('-pooler');
};

const redact = (text, secrets) =>
	secrets.reduce(
		(current, secret) => (secret ? current.split(secret).join('[redacted]') : current),
		text,
	);

const psqlBin = () => {
	const installed = '/Library/PostgreSQL/18/bin/psql';
	return existsSync(installed) ? installed : 'psql';
};

const psql = (bin, connection, args, secrets) => {
	try {
		return execFileSync(bin, [connection, ...args], {
			encoding: 'utf8',
			stdio: ['ignore', 'pipe', 'pipe'],
		});
	} catch (error) {
		const stderr =
			error instanceof Error && 'stderr' in error ? String(error.stderr) : String(error);
		const message = redact(stderr, secrets).trim();
		throw new Error(message.length > 0 ? message : 'psql failed');
	}
};

const shared = { ...readEnv('.env.development'), ...readEnv('.env') };
const production = readEnv('.env.production');
const sourceUrl = shared.DATABASE_URL ?? '';

if (sourceUrl.length === 0 || !isLocal(sourceUrl) || isNeonPooler(sourceUrl)) {
	console.error('Need a local DATABASE_URL in .env or .env.development.');
	process.exit(1);
}

const authBase = shared.NEON_AUTH_BASE_URL ?? '';
const viteAuth = shared.VITE_NEON_AUTH_URL ?? '';
if (authBase.length === 0 || viteAuth.length === 0) {
	console.error('NEON_AUTH_BASE_URL and VITE_NEON_AUTH_URL are required.');
	process.exit(1);
}

const source = new URL(sourceUrl);
const secrets = [sourceUrl, source.password, decodeURIComponent(source.password)];
const devUrl = new URL(sourceUrl);
devUrl.pathname = '/borrow_desk';
const adminUrl = new URL(sourceUrl);
adminUrl.pathname = '/postgres';

const bin = psqlBin();
const exists = psql(
	bin,
	adminUrl.href,
	['-tA', '-v', 'ON_ERROR_STOP=1', '-c', "SELECT 1 FROM pg_database WHERE datname = 'borrow_desk'"],
	secrets,
).trim();
if (exists !== '1') {
	psql(bin, adminUrl.href, ['-v', 'ON_ERROR_STOP=1', '-c', 'CREATE DATABASE borrow_desk'], secrets);
}
psql(bin, devUrl.href, ['-v', 'ON_ERROR_STOP=1', '-c', 'SELECT 1'], secrets);

const productionUrl = production.DATABASE_URL ?? '';
if (productionUrl.length > 0 && (isLocal(productionUrl) || !isNeonPooler(productionUrl))) {
	console.error('Refusing to keep a production DATABASE_URL that is not a Neon pooler.');
	process.exit(1);
}

writeEnv('.env.development', [
	['APP_ENV', 'development'],
	['PORT', '3000'],
	['WEB_PORT', '5173'],
	['DATABASE_URL', devUrl.href],
	['PG_PREPARE', 'true'],
	['PG_MAX_CONNECTIONS', '10'],
	['PG_IDLE_TIMEOUT', '30 seconds'],
	['NEON_AUTH_BASE_URL', authBase],
	['VITE_NEON_AUTH_URL', viteAuth],
]);

writeEnv('.env.production', [
	['APP_ENV', 'production'],
	['DATABASE_URL', productionUrl],
	['PG_PREPARE', 'false'],
	['PG_MAX_CONNECTIONS', '1'],
	['PG_IDLE_TIMEOUT', '10 seconds'],
	['NEON_AUTH_BASE_URL', authBase],
	['VITE_NEON_AUTH_URL', viteAuth],
]);

writeFileSync(
	'.env',
	'# Unused. Development uses .env.development. Production uses .env.production.\n# Run pnpm setup, then pnpm dev.\n',
	{ mode: 0o600 },
);

console.log(
	`development: local PostgreSQL at ${hostnameOf(devUrl.href)}, database borrow_desk, port 3000, web 5173`,
);
if (productionUrl.length === 0) {
	console.log(
		'production: pool settings written; DATABASE_URL is empty until a Neon pooler URL is set',
	);
} else {
	console.log(`production: Neon pooler at ${hostnameOf(productionUrl)}`);
}
