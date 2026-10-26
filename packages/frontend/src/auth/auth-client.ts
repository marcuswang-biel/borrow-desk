import { Unauthorized } from '@borrow-desk/api';
import { createAuthClient } from 'better-auth/client';
import * as Effect from 'effect/Effect';

import { i18n } from '../lib/i18n/index.ts';

/** Better Auth base URL. The dev server and production site both serve /api/auth. */
const authUrl = `${window.location.origin}/api/auth`;

/** Browser client for email sign-in and sign-up. */
const authClient = createAuthClient({
	baseURL: authUrl,
	fetchOptions: {
		credentials: 'include',
	},
});

/** Turns a thrown Auth failure into Unauthorized. */
const unauthorized = (cause: unknown) => {
	if (
		typeof cause === 'object' &&
		cause !== null &&
		'message' in cause &&
		typeof cause.message === 'string' &&
		cause.message.length > 0
	) {
		return new Unauthorized({ message: cause.message });
	}
	return new Unauthorized({ message: i18n.t('requestFailed') });
};

/** Fails when Better Auth reports an error on an otherwise resolved call. */
const rejectResult = (result: unknown) => {
	if (
		typeof result === 'object' &&
		result !== null &&
		'error' in result &&
		result.error !== null &&
		result.error !== undefined
	) {
		return Effect.fail(unauthorized(result.error));
	}
	return Effect.void;
};

/** Reads a JWT from the Better Auth session cookie. No cookie is a signed-out success. */
export const sessionToken = Effect.tryPromise({
	try: async () => {
		const response = await fetch(`${authUrl}/token`, { credentials: 'include' });
		if (!response.ok) {
			return undefined;
		}
		const body = (await response.json()) as { token?: string };
		return typeof body.token === 'string' && body.token.length > 0 ? body.token : undefined;
	},
	catch: unauthorized,
});

/** Signs in with email and password. A rejected password fails with Unauthorized. */
export const signIn = (email: string, password: string) =>
	Effect.tryPromise({
		try: () => authClient.signIn.email({ email, password }),
		catch: unauthorized,
	}).pipe(Effect.flatMap(rejectResult));

/** Creates an account, then signs it in. A rejected registration fails with Unauthorized. */
export const signUp = (name: string, email: string, password: string) =>
	Effect.tryPromise({
		try: () => authClient.signUp.email({ name, email, password }),
		catch: unauthorized,
	}).pipe(Effect.flatMap(rejectResult));

/** Ends the Better Auth session. */
export const signOut = Effect.tryPromise({
	try: () => authClient.signOut(),
	catch: unauthorized,
}).pipe(Effect.flatMap(rejectResult));
