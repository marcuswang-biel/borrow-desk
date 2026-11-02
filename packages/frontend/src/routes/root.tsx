import { createRootRoute } from '@tanstack/react-router';

import { Spinner } from '@/components/ui/spinner';

import { SessionProvider, SignInPanel, useSession } from '../auth/index.ts';
import { LanguageSelect, Shell } from '../components/shell.tsx';
import { m } from '../paraglide/messages.js';
import { MissingPage } from './miss.tsx';

/** Session check shown before any page. */
const SessionPending = () => (
	<div className="flex h-full items-center justify-center pt-8">
		<Spinner aria-label={m.checkingSession()} className="size-6" />
	</div>
);

/** Root gate. The session check and the account form stay here. Desk pages render only after sign-in. */
const AccountGate = () => {
	const { status } = useSession();
	if (status === 'signed-in') {
		return <Shell />;
	}

	return (
		<div className="flex min-h-svh flex-col">
			<header className="flex min-h-14 items-center justify-end px-4">
				<LanguageSelect />
			</header>
			<div className="flex flex-1 items-center justify-center p-4">
				{status === 'loading' ? <SessionPending /> : <SignInPanel />}
			</div>
		</div>
	);
};

/** Root route. The account form is not a page. An unknown path stays inside the desk shell. */
const RootLayout = () => (
	<SessionProvider>
		<AccountGate />
	</SessionProvider>
);

/** Root route. Sign-in stays on this route. The catalog and loans render after the session is known. */
export const Route = createRootRoute({
	component: RootLayout,
	notFoundComponent: MissingPage,
});
