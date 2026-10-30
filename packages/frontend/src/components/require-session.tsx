import { Navigate } from '@tanstack/react-router';
import { type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import { Skeleton } from '@/components/ui/skeleton';

import { useSession } from '../auth/index.ts';

/** Sends a signed-out visitor back to sign-in, then renders the page. */
export const RequireSession = ({ children }: { children: ReactNode }) => {
	const { t } = useTranslation();
	const { status } = useSession();
	if (status === 'loading') {
		return (
			<div className="flex flex-col gap-3">
				<p className="text-muted-foreground m-0 text-sm">{t('checkingSession')}</p>
				<Skeleton className="h-8 w-48" />
				<Skeleton className="h-10 w-full" />
				<Skeleton className="h-10 w-2/3" />
			</div>
		);
	}
	if (status !== 'signed-in') {
		return <Navigate to="/" replace />;
	}
	return children;
};
