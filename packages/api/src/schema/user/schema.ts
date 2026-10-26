import * as Schema from 'effect/Schema';

/** Role stored for a signed-in person. */
export const Role = Schema.Literals(['admin', 'employee']);

/** Person resolved from the bearer token. */
export const User = Schema.Struct({
	id: Schema.String,
	email: Schema.String,
	name: Schema.String,
	role: Role,
});

/** User value shared by the API and the server. */
export type User = typeof User.Type;
/** Role value carried on the current user. */
export type Role = typeof Role.Type;
