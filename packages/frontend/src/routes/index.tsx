import { BrowserRouter, Route, Routes } from 'react-router';

import { SessionProvider } from '../auth/index.ts';
import { RequireSession } from '../components/require-session.tsx';
import { Shell } from '../components/shell.tsx';
import { EquipmentPage } from './equipment.tsx';
import { LoansPage } from './loans.tsx';
import { MissingPage } from './missing.tsx';
import { SignInPage } from './sign-in.tsx';

export const routes = [
	{ to: '/equipment', tTag: 'equipment' },
	{ to: '/loans', tTag: 'loans' },
] as const;

/** Browser routes. Sign-in is `/`. The catalog and the loan board require a session. */
export const AppRoutes = () => (
	<BrowserRouter>
		<SessionProvider>
			<Routes>
				<Route element={<Shell />}>
					<Route index element={<SignInPage />} />
					<Route element={<RequireSession />}>
						<Route path="equipment" element={<EquipmentPage />} />
						<Route path="loans" element={<LoansPage />} />
					</Route>
					<Route path="*" element={<MissingPage />} />
				</Route>
			</Routes>
		</SessionProvider>
	</BrowserRouter>
);
