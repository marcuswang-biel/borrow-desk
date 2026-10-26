/** Failures that reject the caller. */
export { Forbidden, Unauthorized } from './error.ts';

/** Union of those caller failures. */
export type { UserError } from './error.ts';

/** Signed-in person schemas. */
export { Role, User } from './schema.ts';
