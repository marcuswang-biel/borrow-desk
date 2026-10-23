import * as Schema from 'effect/Schema';

export const Health = Schema.Struct({
	status: Schema.Literal('ok'),
});
