/**
 * WorkoutSessionStatus value object.
 * Represents the valid states of a workout session.
 * State transitions: IN_PROGRESS → FINISHED | DISCARDED (immutable after terminal state).
 */
export enum WorkoutSessionStatus {
  IN_PROGRESS = 'in_progress',
  FINISHED = 'finished',
  DISCARDED = 'discarded',
}
