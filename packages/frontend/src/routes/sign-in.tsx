import { useTranslation } from 'react-i18next';
import { Navigate } from 'react-router';

import { SignInPanel, useSession } from '../auth/index.ts';
import { meta, signIn, skeleton, skeletonShort, skeletonShorter } from '../lib/ui.ts';

/** Sign-in route. A restored session goes to the catalog. */
export const SignInPage = () => {
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
	if (status === 'signed-in') {
		return <Navigate to="/equipment" replace />;
	}

	return (
		<div className={signIn}>
			<SignInPanel />
		</div>
	);
};
