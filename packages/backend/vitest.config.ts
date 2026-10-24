import { defineConfig } from 'vitest/config';

/** Vitest settings for the backend package. */
export default defineConfig({
	cacheDir: 'build/vite',
	test: {
		include: ['test/**/*.test.ts'],
		fsModuleCachePath: 'build/vitest',
	},
});
