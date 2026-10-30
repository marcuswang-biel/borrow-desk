import * as DateTime from 'effect/DateTime';

/** Milliseconds since the epoch for one instant. */
const millis = DateTime.toEpochMillis;

/**
 * Two half-open ranges overlap when each starts before the other ends.
 * Touching at an endpoint does not overlap.
 */
export const rangesOverlap = (
	leftStart: DateTime.DateTime,
	leftEnd: DateTime.DateTime,
	rightStart: DateTime.DateTime,
	rightEnd: DateTime.DateTime,
): boolean => millis(leftStart) < millis(rightEnd) && millis(rightStart) < millis(leftEnd);
