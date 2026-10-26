/**
 * Two half-open ranges overlap when each starts before the other ends.
 * Touching at an endpoint does not overlap.
 */
export const rangesOverlap = (
	leftStart: number,
	leftEnd: number,
	rightStart: number,
	rightEnd: number,
): boolean => leftStart < rightEnd && rightStart < leftEnd;
