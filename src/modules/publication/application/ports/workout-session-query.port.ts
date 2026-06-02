import { ExerciseSummary } from '../../domain/value-objects/exercise-summary.value-object';

export interface WorkoutSessionData {
  id: string;
  routineName: string;
  dayOfWeek: string;
  durationMinutes: number | null;
  exercises: WorkoutExerciseData[];
}

export interface WorkoutExerciseData {
  exerciseId: string;
  exerciseName: string;
  completedSets: number;
  totalSets: number;
  volume: number;
  workoutSets: WorkoutSetData[];
}

export interface WorkoutSetData {
  setNumber: number;
  repsPerformed: number | null;
  weightUsed: number | null;
  targetReps: number | null;
  targetWeight: number | null;
  completed: boolean;
}

export const WORKOUT_SESSION_QUERY_PORT = Symbol('WORKOUT_SESSION_QUERY_PORT');

export interface WorkoutSessionQueryPort {
  findById(sessionId: string): Promise<WorkoutSessionData | null>;
  buildExerciseSummary(session: WorkoutSessionData): ExerciseSummary;
}
