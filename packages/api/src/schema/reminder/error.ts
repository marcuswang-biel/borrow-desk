import * as Schema from 'effect/Schema';

/** The reminder is missing, or it belongs to someone else. */
export class ReminderNotFound extends Schema.TaggedError<ReminderNotFound>()(
	'ReminderNotFound',
	{ message: Schema.String },
	{ httpApiStatus: 404 },
) {}

/** Failures from reading one reminder. */
export type ReminderError = ReminderNotFound;
