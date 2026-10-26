import { HttpApiGroup } from 'effect/http-api';

import { Authentication } from '../../../auth.ts';
import { getMe } from './routes.ts';

/** Routes that only need a signed-in person. */
export const SessionGroup = HttpApiGroup.make('session').add(getMe).middleware(Authentication);
