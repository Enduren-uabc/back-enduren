/**
 * WorkoutSessionStatus value object.
 * Represents the valid states of a workout session.
 * State transitions: IN_PROGRESS → FINISHED (immutable after FINISHED).
 */
export enum WorkoutSessionStatus {
  IN_PROGRESS = 'in_progress',
  FINISHED = 'finished',
}
