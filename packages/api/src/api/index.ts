import { HttpApi } from 'effect/http-api';

import { EquipmentGroup } from './groups/equipment/index.ts';
import { HealthGroup } from './groups/health/index.ts';
import { LoansGroup } from './groups/loans/index.ts';
import { RemindersGroup } from './groups/reminders/index.ts';
import { SessionGroup } from './groups/session/index.ts';

/** Groups assembled into the shared contract. */
export { EquipmentGroup, HealthGroup, LoansGroup, RemindersGroup, SessionGroup };

/** Shared HTTP contract. The browser client is generated from this value. */
export const Api = HttpApi.make('borrow-desk')
	.add(HealthGroup)
	.add(SessionGroup)
	.add(EquipmentGroup)
	.add(LoansGroup)
	.add(RemindersGroup);
