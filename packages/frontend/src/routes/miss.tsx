import { Link } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { Empty, EmptyContent, EmptyHeader, EmptyTitle } from '@/components/ui/empty';

import { useSession } from '../auth/index.ts';

/** Unknown path. The link returns to the page that matches the session. */
export const MissingPage = () => {
	const { t } = useTranslation();
	const { status } = useSession();

	return (
		<Empty>
			<EmptyHeader>
				<EmptyTitle>{t('missing')}</EmptyTitle>
			</EmptyHeader>
			<EmptyContent>
				{status === 'signed-in' ? (
					<Button render={<Link to="/equipment" />} variant="outline">
						{t('goToEquipment')}
					</Button>
				) : null}
				{status === 'anonymous' ? (
					<Button render={<Link to="/" />} variant="outline">
						{t('goToSignIn')}
					</Button>
				) : null}
			</EmptyContent>
		</Empty>
	);
};
