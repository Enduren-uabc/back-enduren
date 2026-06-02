import { WorkoutSession } from '../../domain/entities/workout-session.entity';

export interface WorkoutSessionOutput {
  id: string;
  userId: string;
  routineId: string;
  sourceType: string;
  assignedRoutineId: string | null;
  dayOfWeek: string;
  status: string;
  currentExerciseIndex: number;
  exercises: Array<{
    exerciseId: string;
    exerciseName: string;
    order: number;
    targetSets: Array<{
      setNumber: number;
      reps: number;
      weight: number;
    }>;
    workoutSets: Array<{
      setNumber: number;
      repsPerformed: number | null;
      weightUsed: number | null;
      targetReps: number | null;
      targetWeight: number | null;
      completed: boolean;
    }>;
  }>;
  startedAt: Date;
  finishedAt: Date | null;
}

export function mapWorkoutSessionToOutput(
  session: WorkoutSession,
): WorkoutSessionOutput {
  return {
    id: session.id,
    userId: session.userId,
    routineId: session.routineId,
    sourceType: session.sourceType,
    assignedRoutineId: session.assignedRoutineId,
    dayOfWeek: session.dayOfWeek,
    status: session.status,
    currentExerciseIndex: session.currentExerciseIndex,
    exercises: session.exercises.map((ex) => ({
      exerciseId: ex.exerciseId,
      exerciseName: ex.exerciseName,
      order: ex.order,
      targetSets: ex.targetSets.map((ts) => ({
        setNumber: ts.setNumber,
        reps: ts.reps,
        weight: ts.weight,
      })),
      workoutSets: ex.workoutSets.map((ws) => ({
        setNumber: ws.setNumber,
        repsPerformed: ws.repsPerformed,
        weightUsed: ws.weightUsed,
        targetReps: ws.targetReps,
        targetWeight: ws.targetWeight,
        completed: ws.completed,
      })),
    })),
    startedAt: session.startedAt,
    finishedAt: session.finishedAt,
  };
}
