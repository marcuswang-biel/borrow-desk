import { Forbidden, type User } from '@borrow-desk/api';
import * as Effect from 'effect/Effect';

/** Allows the action only when the signed-in person is an admin. */
export const requireAdmin = (user: User) =>
	user.role === 'admin'
		? Effect.void
		: Effect.fail(new Forbidden({ message: 'Only an admin can record equipment' }));
