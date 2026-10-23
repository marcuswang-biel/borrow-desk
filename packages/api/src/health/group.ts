import * as HttpApiEndpoint from 'effect/http-api/HttpApiEndpoint';
import * as HttpApiGroup from 'effect/http-api/HttpApiGroup';

import { Health } from './schema.ts';

export const getHealth = HttpApiEndpoint.get('getHealth', '/api/health', {
	success: Health,
});

export const HealthGroup = HttpApiGroup.make('health').add(getHealth);
