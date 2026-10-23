import { spawn } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';

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

if (!existsSync('.env.development')) {
	console.error('Missing .env.development. Run pnpm setup.');
	process.exit(1);
}

const env = parseEnv(readFileSync('.env.development', 'utf8'));
const databaseUrl = env.DATABASE_URL ?? '';
const host = databaseUrl.length === 0 ? '' : new URL(databaseUrl).hostname;

if (
	env.APP_ENV !== 'development' ||
	env.PORT !== '3000' ||
	env.WEB_PORT !== '5173' ||
	!localHosts.has(host)
) {
	console.error('pnpm dev only starts local PostgreSQL on port 3000 and the page on port 5173.');
	process.exit(1);
}

const childEnv = { ...process.env, ...env };
const backend = spawn('node', ['--env-file=.env.development', 'packages/backend/src/main.ts'], {
	stdio: 'inherit',
	env: childEnv,
});
const frontend = spawn(
	'pnpm',
	['--filter', '@borrow-desk/frontend', 'dev', '--', '--port', '5173', '--strictPort'],
	{ stdio: 'inherit', env: childEnv },
);

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
