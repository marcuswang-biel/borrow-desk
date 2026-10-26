import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';

import { useSession } from '../auth/index.ts';
import { btnSecondary, screenHead } from '../lib/ui.ts';

/** Unknown path. The link returns to the page that matches the session. */
export const MissingPage = () => {
	const { t } = useTranslation();
	const { status } = useSession();

	return (
		<section>
			<div className={screenHead}>
				<h1>{t('missing')}</h1>
			</div>
			{status === 'signed-in' ? (
				<Link className={btnSecondary} to="/equipment">
					{t('goToEquipment')}
				</Link>
			) : null}
			{status === 'anonymous' ? (
				<Link className={btnSecondary} to="/">
					{t('goToSignIn')}
				</Link>
			) : null}
		</section>
	);
};
