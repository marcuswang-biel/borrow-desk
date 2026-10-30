import { useTranslation } from 'react-i18next';
import { Navigate } from 'react-router';

import { Skeleton } from '@/components/ui/skeleton';

import { SignInPanel, useSession } from '../auth/index.ts';

/** Sign-in route. A restored session goes to the catalog. */
export const SignInPage = () => {
	const { t } = useTranslation();
	const { status } = useSession();

	if (status === 'loading') {
		return (
			<div className="mx-auto flex w-full max-w-md flex-col gap-3">
				<p className="text-muted-foreground m-0 text-sm">{t('checkingSession')}</p>
				<Skeleton className="h-8 w-40" />
				<Skeleton className="h-10 w-full" />
				<Skeleton className="h-10 w-full" />
			</div>
		);
	}
	if (status === 'signed-in') {
		return <Navigate to="/equipment" replace />;
	}

	return (
		<div className="flex justify-center py-8">
			<SignInPanel />
		</div>
	);
};
