import tailwindcss from '@tailwindcss/vite';
import { redact } from '@tanstack/redact/vite';
import { tanstackRouter } from '@tanstack/router-plugin/vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';

/** Vite config. Redact replaces the React runtime. The dev server proxies /api so Better Auth cookies stay on one origin. */
export default defineConfig({
	cacheDir: 'build/vite',
	envDir: '../..',
	plugins: [
		tanstackRouter({
			target: 'react',
			autoCodeSplitting: true,
			/** Shell is root.tsx. The unknown page is miss.tsx and stays off the route list. */
			virtualRouteConfig: {
				type: 'root',
				file: 'root.tsx',
				children: [
					{ type: 'index', file: 'index.tsx' },
					{ type: 'route', path: '/equipment', file: 'equipment.tsx' },
					{ type: 'route', path: '/loans', file: 'loans.tsx' },
				],
			},
		}),
		react(),
		tailwindcss(),
		redact({ features: { hydration: false } }),
	],
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
