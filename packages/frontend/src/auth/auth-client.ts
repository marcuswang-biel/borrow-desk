import { Unauthorized } from '@borrow-desk/api';
import { createAuthClient } from 'better-auth/client';
import * as Effect from 'effect/Effect';
import * as Option from 'effect/Option';
import * as Schema from 'effect/Schema';

import { getLocale } from '../lib/i18n/index.ts';
import { m } from '../paraglide/messages.js';

/** Better Auth error body that carries a sentence. */
const AuthErrorBody = Schema.Struct({
	message: Schema.NonEmptyString,
});

/** Better Auth base URL. The dev server and production site both serve /api/auth. */
const authUrl = `${window.location.origin}/api/auth`;

/** Page opened after the activation link is used. */
const activatedPath = '/equipment';

/** Better Auth code for an account that has not opened the activation link. */
const activationCode = 'EMAIL_NOT_VERIFIED';

/** Page language header read by the activation mail. */
const localeHeader = 'x-borrow-desk-locale';

/** Signed in, or waiting for the activation link. */
export type AuthStep =
	| { readonly _tag: 'SignedIn' }
	| { readonly _tag: 'ActivationRequired'; readonly email: string };

/** A session was created. */
const signedIn: AuthStep = { _tag: 'SignedIn' };

/** The account cannot use the desk until the link is opened. */
const activationRequired = (email: string): AuthStep => ({
	_tag: 'ActivationRequired',
	email,
});

/** Browser client for email sign-in and sign-up. */
const authClient = createAuthClient({
	baseURL: authUrl,
	fetchOptions: {
		credentials: 'include',
		onRequest(context) {
			context.headers.set(localeHeader, getLocale());
		},
	},
});

/** Turns a thrown Auth failure into Unauthorized. */
const unauthorized = (cause: unknown) => {
	const decoded = Schema.decodeUnknownOption(AuthErrorBody)(cause);
	const message = Option.isSome(decoded) ? decoded.value.message : m.requestFailed();
	return new Unauthorized({ message });
};

/** Better Auth error fields the page branches on. */
const AuthFailure = Schema.Struct({
	code: Schema.optional(Schema.String),
	message: Schema.optional(Schema.String),
});

/** A resolved Better Auth call, including a call that reported an error. */
const AuthCall = Schema.Struct({
	error: Schema.NullishOr(AuthFailure),
	data: Schema.optional(Schema.Unknown),
});

/** Sign-up or sign-in body. A missing token means no session was created. */
const CreatedAccount = Schema.Struct({
	token: Schema.NullOr(Schema.String),
	user: Schema.Struct({
		email: Schema.String,
	}),
});

/** Turns a resolved auth call into a session or an activation wait. */
const settle = (email: string, result: unknown) => {
	const decoded = Schema.decodeUnknownOption(AuthCall)(result);
	if (Option.isNone(decoded)) {
		return Effect.fail(new Unauthorized({ message: m.requestFailed() }));
	}
	const error = decoded.value.error;
	if (error !== undefined && error !== null) {
		if (error.code === activationCode) {
			return Effect.succeed(activationRequired(email));
		}
		return Effect.fail(unauthorized(error));
	}
	const created = Schema.decodeUnknownOption(CreatedAccount)(decoded.value.data);
	if (
		Option.isSome(created) &&
		(created.value.token === null || created.value.token.length === 0)
	) {
		return Effect.succeed(activationRequired(created.value.user.email));
	}
	return Effect.succeed(signedIn);
};

/** Fails when Better Auth reports an error on an otherwise resolved call. */
const rejectResult = (result: unknown) => {
	const decoded = Schema.decodeUnknownOption(AuthCall)(result);
	if (Option.isNone(decoded) || decoded.value.error === undefined || decoded.value.error === null) {
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

/** Signs in with email and password. An unactivated account waits for the link. */
export const signIn = (email: string, password: string) =>
	Effect.tryPromise({
		try: () => authClient.signIn.email({ email, password, callbackURL: activatedPath }),
		catch: unauthorized,
	}).pipe(Effect.flatMap((result) => settle(email, result)));

/** Creates an account and sends the activation link. No session is created. */
export const signUp = (name: string, email: string, password: string) =>
	Effect.tryPromise({
		try: () => authClient.signUp.email({ name, email, password, callbackURL: activatedPath }),
		catch: unauthorized,
	}).pipe(Effect.flatMap((result) => settle(email, result)));

/** Sends the activation link again. A leftover session is cleared first so the address is not compared with it. */
export const sendActivation = (email: string) =>
	Effect.tryPromise({
		try: async () => {
			await authClient.signOut();
			return authClient.sendVerificationEmail({ email, callbackURL: activatedPath });
		},
		catch: unauthorized,
	}).pipe(Effect.flatMap(rejectResult));

/** Ends the Better Auth session. */
export const signOut = Effect.tryPromise({
	try: () => authClient.signOut(),
	catch: unauthorized,
}).pipe(Effect.flatMap(rejectResult));
