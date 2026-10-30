import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { TooltipProvider } from '@/components/ui/tooltip';

import './lib/i18n/index.ts';
import { AppRoutes } from './routes/index.tsx';
import './styles.css';

/** Page root. The document must contain #root. */
const root = document.querySelector('#root');
if (root === null) {
	throw new Error('Missing #root');
}

createRoot(root).render(
	<StrictMode>
		<TooltipProvider>
			<AppRoutes />
		</TooltipProvider>
	</StrictMode>,
);
