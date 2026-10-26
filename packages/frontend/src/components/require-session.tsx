import { useTranslation } from 'react-i18next';
import { Navigate, Outlet } from 'react-router';

import { useSession } from '../auth/index.ts';
import { meta, skeleton, skeletonShort, skeletonShorter } from '../lib/ui.ts';

/** Sends a signed-out visitor back to sign-in. */
export const RequireSession = () => {
	const { t } = useTranslation();
	const { status } = useSession();
	if (status === 'loading') {
		return (
			<div>
				<p className={meta}>{t('checkingSession')}</p>
				<div className={skeleton} />
				<div className={skeletonShort} />
				<div className={skeletonShorter} />
			</div>
		);
	}
	if (status !== 'signed-in') {
		return <Navigate to="/" replace />;
	}
	return <Outlet />;
};
