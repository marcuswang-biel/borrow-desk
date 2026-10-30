import { createRootRoute } from '@tanstack/react-router';

import { SessionProvider } from '../auth/index.ts';
import { Shell } from '../components/shell.tsx';
import { MissingPage } from './miss.tsx';

/** Shell around every page. An unknown path stays inside that shell. */
const RootLayout = () => (
	<SessionProvider>
		<Shell />
	</SessionProvider>
);

/** Root route. Sign-in is public. The catalog and loans sit behind the session gate. */
export const Route = createRootRoute({
	component: RootLayout,
	notFoundComponent: MissingPage,
});
