import { Unauthorized } from '@borrow-desk/api';
import { createAuthClient } from 'better-auth/client';
import * as Effect from 'effect/Effect';
import * as Option from 'effect/Option';
import * as Schema from 'effect/Schema';

import { m } from '../paraglide/messages.js';

/** Better Auth error body that carries a sentence. */
const AuthErrorBody = Schema.Struct({
	message: Schema.NonEmptyString,
});

/** A resolved Better Auth call that still reported an error. */
const RejectedCall = Schema.Struct({
	error: Schema.Unknown,
});

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
	const decoded = Schema.decodeUnknownOption(AuthErrorBody)(cause);
	const message = Option.isSome(decoded) ? decoded.value.message : m.requestFailed();
	return new Unauthorized({ message });
};

/** Fails when Better Auth reports an error on an otherwise resolved call. */
const rejectResult = (result: unknown) => {
	const decoded = Schema.decodeUnknownOption(RejectedCall)(result);
	if (Option.isNone(decoded) || decoded.value.error === null || decoded.value.error === undefined) {
		return Effect.void;
	}
	return Effect.fail(unauthorized(decoded.value.error));
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
