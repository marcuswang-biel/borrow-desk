import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { HealthPage } from './health.tsx';
import './styles.css';

const root = document.getElementById('root');

if (root === null) {
	throw new Error('缺少 #root');
}

createRoot(root).render(
	<StrictMode>
		<HealthPage />
	</StrictMode>,
);
