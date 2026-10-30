import { createRouter, RouterProvider } from '@tanstack/react-router';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { TooltipProvider } from '@/components/ui/tooltip';

import './lib/i18n/index.ts';
import { routeTree } from './routeTree.gen.ts';
import './styles.css';

/** Page router. The tree comes from the files in `src/routes`. */
const router = createRouter({ routeTree });

declare module '@tanstack/react-router' {
	interface Register {
		router: typeof router;
	}
}

/** Page root. The document must contain #root. */
const root = document.querySelector('#root');
if (root === null) {
	throw new Error('Missing #root');
}

createRoot(root).render(
	<StrictMode>
		<TooltipProvider>
			<RouterProvider router={router} />
		</TooltipProvider>
	</StrictMode>,
);
