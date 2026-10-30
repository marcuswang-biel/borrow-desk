import { Link } from '@tanstack/react-router';

import { Button } from '@/components/ui/button';
import { Empty, EmptyContent, EmptyHeader, EmptyTitle } from '@/components/ui/empty';

import { useSession } from '../auth/index.ts';
import { m } from '../paraglide/messages.js';

/** Unknown path. The link returns to the page that matches the session. */
export const MissingPage = () => {
	const { status } = useSession();

	return (
		<Empty>
			<EmptyHeader>
				<EmptyTitle>{m.missing()}</EmptyTitle>
			</EmptyHeader>
			<EmptyContent>
				{status === 'signed-in' ? (
					<Button render={<Link to="/equipment" />} variant="outline">
						{m.goToEquipment()}
					</Button>
				) : null}
				{status === 'anonymous' ? (
					<Button render={<Link to="/" />} variant="outline">
						{m.goToSignIn()}
					</Button>
				) : null}
			</EmptyContent>
		</Empty>
	);
};
