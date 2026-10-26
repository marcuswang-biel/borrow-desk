import { execFileSync } from 'node:child_process';
import { chmodSync, existsSync, readFileSync, writeFileSync } from 'node:fs';

/** Hosts that count as this machine. */
const localHosts = new Set(['localhost', '127.0.0.1', '::1']);

/** Reads KEY=value lines. Blank lines and comments are skipped. */
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
		values[key] = unquote(trimmed.slice(separator + 1).trim());
	}
	return values;
};

/** Removes one matching pair of quotes from a dotenv value. */
const unquote = (value) => {
	if (
		(value.startsWith('"') && value.endsWith('"')) ||
		(value.startsWith("'") && value.endsWith("'"))
	) {
		return value.slice(1, -1);
	}
	return value;
};

/** Quotes a value when dotenv would otherwise split it. */
const formatEntry = (key, value) => {
	if (value.length === 0) {
		return `${key}=`;
	}
	if (/[\s#"']/.test(value)) {
		return `${key}=${JSON.stringify(value)}`;
	}
	return `${key}=${value}`;
};

/**
 * Reads .env.example.
 * Uncommented assignments are the development file.
 * A commented KEY=value overrides that key in the production file.
 */
const parseExample = (text) => {
	const development = [];
	const productionOverrides = new Map();
	for (const line of text.split('\n')) {
		const trimmed = line.trim();
		if (trimmed.length === 0) {
			continue;
		}
		const commented = trimmed.startsWith('#');
		const body = commented ? trimmed.slice(1).trim() : trimmed;
		const separator = body.indexOf('=');
		if (separator < 0) {
			continue;
		}
		const key = body.slice(0, separator).trim();
		if (!/^[A-Z0-9_]+$/.test(key)) {
			continue;
		}
		const value = unquote(body.slice(separator + 1).trim());
		if (commented) {
			productionOverrides.set(key, value);
		} else {
			development.push([key, value]);
		}
	}
	const production = development.map(([key, value]) => [
		key,
		productionOverrides.get(key) ?? value,
	]);
	return { development, production };
};

/** Keeps an existing value. An empty existing value is kept only when asked. */
const overlay = (entries, existing, keepEmpty) =>
	entries.map(([key, value]) => {
		const current = existing[key];
		if (current === undefined) {
			return [key, value];
		}
		if (current.length === 0 && !keepEmpty) {
			return [key, value];
		}
		return [key, current];
	});

/** Writes a private env file. */
const writeEnv = (path, entries) => {
	const body = `${entries.map(([key, value]) => formatEntry(key, value)).join('\n')}\n`;
	writeFileSync(path, body, { mode: 0o600 });
	chmodSync(path, 0o600);
};

/** Reads an env file when it exists. */
const readEnv = (path) => (existsSync(path) ? parseEnv(readFileSync(path, 'utf8')) : {});

/** Hostname of a database URL. */
const hostnameOf = (databaseUrl) => new URL(databaseUrl).hostname;

/** True when the database URL points at this machine. */
const isLocal = (databaseUrl) => localHosts.has(hostnameOf(databaseUrl));

/** True when the database URL is a Neon pooled host. */
const isNeonPooler = (databaseUrl) => {
	const host = hostnameOf(databaseUrl);
	return (host.endsWith('.neon.tech') || host.endsWith('.neon.build')) && host.includes('-pooler');
};

/** Points a database URL at one database name. */
const withDatabase = (databaseUrl, name) => {
	const url = new URL(databaseUrl);
	url.pathname = `/${name}`;
	return url.href;
};

/** Hides connection strings and passwords in a command failure. */
const redact = (text, secrets) =>
	secrets.reduce(
		(current, secret) => (secret ? current.split(secret).join('[redacted]') : current),
		text,
	);

/** Uses the PostgreSQL 18 client when it is installed. */
const psqlBin = () => {
	const installed = '/Library/PostgreSQL/18/bin/psql';
	return existsSync(installed) ? installed : 'psql';
};

/** Runs psql and redacts secrets from a failure. */
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

if (!existsSync('.env.example')) {
	console.error('Missing .env.example.');
	process.exit(1);
}

/** Development and production assignments from the example. */
const example = parseExample(readFileSync('.env.example', 'utf8'));
/** Local values already chosen on this machine. */
const existingDevelopment = { ...readEnv('.env'), ...readEnv('.env.development') };
/** Production values already chosen on this machine. */
const existingProduction = readEnv('.env.production');

/** Development file, with existing non-empty values kept. */
let development = overlay(example.development, existingDevelopment, false);
/** Production file. An existing file keeps its values, including blanks. */
let production = overlay(example.production, existingProduction, existsSync('.env.production'));

/** Local database URL taken from the merged development file. */
const rawDevelopmentUrl = development.find(([key]) => key === 'DATABASE_URL')?.[1] ?? '';
if (
	rawDevelopmentUrl.length === 0 ||
	!isLocal(rawDevelopmentUrl) ||
	isNeonPooler(rawDevelopmentUrl)
) {
	console.error('Development DATABASE_URL must be local PostgreSQL.');
	process.exit(1);
}
/** Local database URL that will be written. The database name is borrow_desk. */
const developmentUrl = withDatabase(rawDevelopmentUrl, 'borrow_desk');
development = development.map(([key, value]) =>
	key === 'DATABASE_URL' ? [key, developmentUrl] : [key, value],
);

/** Production database URL that will be written. */
const productionUrl = production.find(([key]) => key === 'DATABASE_URL')?.[1] ?? '';
if (productionUrl.length > 0 && (isLocal(productionUrl) || !isNeonPooler(productionUrl))) {
	console.error('Production DATABASE_URL must be a Neon pooler URL.');
	process.exit(1);
}

/** Parsed local URL, used only to open psql and to redact failures. */
const source = new URL(developmentUrl);
/** Secrets that must not appear in a psql error. */
const secrets = [developmentUrl, source.password, decodeURIComponent(source.password)];
/** Connection to the postgres maintenance database. */
const adminUrl = withDatabase(developmentUrl, 'postgres');
/** psql executable. */
const bin = psqlBin();
/** Whether borrow_desk already exists. */
const exists = psql(
	bin,
	adminUrl,
	['-tA', '-v', 'ON_ERROR_STOP=1', '-c', "SELECT 1 FROM pg_database WHERE datname = 'borrow_desk'"],
	secrets,
).trim();
if (exists !== '1') {
	psql(bin, adminUrl, ['-v', 'ON_ERROR_STOP=1', '-c', 'CREATE DATABASE borrow_desk'], secrets);
}
psql(bin, developmentUrl, ['-v', 'ON_ERROR_STOP=1', '-c', 'SELECT 1'], secrets);

writeEnv('.env.development', development);
writeEnv('.env.production', production);
writeFileSync(
	'.env',
	'# Unused. Development uses .env.development. Production uses .env.production.\n# Run pnpm setup, then pnpm dev.\n',
	{ mode: 0o600 },
);

console.log(
	`development: local PostgreSQL at ${hostnameOf(developmentUrl)}, database borrow_desk, port 3000, web 5173`,
);
if (productionUrl.length === 0) {
	console.log('production: settings written; DATABASE_URL is empty until a Neon pooler URL is set');
} else {
	console.log(`production: Neon pooler at ${hostnameOf(productionUrl)}`);
}
