import * as Schema from 'effect/Schema';

/** Caller is signed out or the token cannot be trusted. */
export class Unauthorized extends Schema.TaggedError<Unauthorized>()(
	'Unauthorized',
	{ message: Schema.String },
	{ httpApiStatus: 401 },
) {}

/** Caller is signed in but the action is not allowed for their role. */
export class Forbidden extends Schema.TaggedError<Forbidden>()(
	'Forbidden',
	{ message: Schema.String },
	{ httpApiStatus: 403 },
) {}

/** Failures that reject the caller before the action runs. */
export type UserError = Unauthorized | Forbidden;
