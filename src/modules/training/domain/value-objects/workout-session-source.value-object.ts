export const WORKOUT_SESSION_SOURCE_TYPES = [
  'personal',
  'trainer_assigned',
] as const;

export type WorkoutSessionSourceType =
  (typeof WORKOUT_SESSION_SOURCE_TYPES)[number];
