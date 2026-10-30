import * as Effect from 'effect/Effect';

/**
 * Database and decode failures are defects.
 * The service interface stays on domain errors.
 */
export const asDefect = <A, E, R>(effect: Effect.Effect<A, E, R>) => Effect.orDie(effect);
