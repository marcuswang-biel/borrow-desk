import { createAuthClient } from 'better-auth/client';

/** Better Auth base URL. The dev server and production site both serve /api/auth. */
const authUrl = `${window.location.origin}/api/auth`;

/** Browser client for email sign-in and sign-up. */
export const authClient = createAuthClient({
	baseURL: authUrl,
	fetchOptions: {
		credentials: 'include',
	},
});

/** Reads a JWT from the Better Auth session cookie. */
export const sessionToken = async (): Promise<string | undefined> => {
	const response = await fetch(`${authUrl}/token`, { credentials: 'include' });
	if (!response.ok) {
		return undefined;
	}
	const body = (await response.json()) as { token?: string };
	return typeof body.token === 'string' && body.token.length > 0 ? body.token : undefined;
};
