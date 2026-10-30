import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';

/** Vite config. The dev server proxies /api so Better Auth cookies stay on one origin. */
export default defineConfig({
	cacheDir: 'build/vite',
	envDir: '../..',
	plugins: [react(), tailwindcss()],
	resolve: {
		alias: {
			'@': fileURLToPath(new URL('./src', import.meta.url)),
		},
	},
	server: {
		port: 5173,
		strictPort: true,
		proxy: {
			'/api': 'http://localhost:3000',
		},
	},
});
