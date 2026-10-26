import { Api } from '@borrow-desk/api';
import { HttpApiBuilder } from 'effect/http-api';
import * as Layer from 'effect/Layer';

import { AuthenticationLive } from './auth/index.ts';
import {
	EquipmentHttpLive,
	LoansHttpLive,
	RemindersHttpLive,
	SessionLive,
} from './features/index.ts';

/** Route handlers. Domain services are provided once, beside this layer. */
export const HttpLive = HttpApiBuilder.layer(Api).pipe(
	Layer.provide(SessionLive),
	Layer.provide(EquipmentHttpLive),
	Layer.provide(LoansHttpLive),
	Layer.provide(RemindersHttpLive),
	Layer.provide(AuthenticationLive),
);
