import * as Context from 'effect/Context';
import * as Schema from 'effect/Schema';

export const User = Schema.Struct({
	id: Schema.String,
	email: Schema.String,
	name: Schema.String,
});

export type User = typeof User.Type;

export class CurrentUser extends Context.Service<CurrentUser, User>()('borrow-desk/CurrentUser') {}
