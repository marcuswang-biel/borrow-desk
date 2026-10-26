import { HttpApiGroup } from 'effect/http-api';

import { getHealth } from './routes.ts';

/** Open health route. */
export const HealthGroup = HttpApiGroup.make('health').add(getHealth);
