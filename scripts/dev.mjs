import { spawn } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';

/** Hosts that count as this machine. */
const localHosts = new Set(['localhost', '127.0.0.1', '::1']);

/** Parses a dotenv file without printing the values. */
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

if (!existsSync('.env.development')) {
	console.error('Missing .env.development. Copy .env.example and fill in the local database.');
	process.exit(1);
}

/** Development environment loaded for both processes. */
const env = parseEnv(readFileSync('.env.development', 'utf8'));
/** Database host taken from DATABASE_URL. */
const databaseUrl = env.DATABASE_URL ?? '';
/** Hostname of the development database. */
const host = databaseUrl.length === 0 ? '' : new URL(databaseUrl).hostname;

if (
	env.APP_ENV !== 'development' ||
	env.PORT !== '3000' ||
	env.WEB_PORT !== '5173' ||
	env.AUTH_PUBLIC_URL !== 'http://localhost:5173' ||
	!localHosts.has(host)
) {
	console.error(
		'pnpm dev starts the API on port 3000 and the page on port 5173, using local PostgreSQL only.',
	);
	process.exit(1);
}

console.log('api  http://localhost:3000');
console.log('web  http://localhost:5173');

/** Environment passed to both child processes. */
const childEnv = { ...process.env, ...env };
/** API process. */
const backend = spawn(
	process.execPath,
	['--env-file=.env.development', 'packages/backend/src/main.ts'],
	{
		stdio: 'inherit',
		env: childEnv,
	},
);
/** Page process. Vite proxies /api to the API process. */
const frontend = spawn('node_modules/.bin/vite', ['--port', '5173', '--strictPort'], {
	cwd: 'packages/frontend',
	stdio: 'inherit',
	env: childEnv,
});

/** Stops both processes. */
const stop = () => {
	backend.kill('SIGTERM');
	frontend.kill('SIGTERM');
};

process.on('SIGINT', () => {
	stop();
	process.exit(0);
});
process.on('SIGTERM', () => {
	stop();
	process.exit(0);
});

backend.on('exit', (code) => {
	if (code !== 0 && code !== null) {
		frontend.kill('SIGTERM');
		process.exit(code);
	}
});
frontend.on('exit', (code) => {
	if (code !== 0 && code !== null) {
		backend.kill('SIGTERM');
		process.exit(code);
	}
});
