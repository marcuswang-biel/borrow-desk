import { createAuthClient, type VanillaBetterAuthClient } from '@neondatabase/auth';
import { BetterAuthVanillaAdapter } from '@neondatabase/auth/vanilla';

const authUrl = import.meta.env.VITE_NEON_AUTH_URL;
if (authUrl.length === 0) {
	throw new Error('Missing VITE_NEON_AUTH_URL');
}

export const authClient: VanillaBetterAuthClient = createAuthClient(authUrl, {
	adapter: BetterAuthVanillaAdapter({
		fetchOptions: { credentials: 'include' }
	})
});