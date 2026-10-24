import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { DeskPage } from './desk.tsx';
import './styles.css';

/** Page root. The document must contain #root. */
const root = document.querySelector('#root');
if (root === null) {
	throw new Error('Missing #root');
}

createRoot(root).render(
	<StrictMode>
		<DeskPage />
	</StrictMode>,
);
