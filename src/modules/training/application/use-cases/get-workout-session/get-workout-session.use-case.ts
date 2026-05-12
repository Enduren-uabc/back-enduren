import {
  WorkoutSessionDomainError,
  WorkoutSessionErrorCode,
} from '../../../domain/errors/workout-session-domain.error';
import { WorkoutSessionRepository } from '../../../domain/repositories/workout-session.repository.port';
import { CurrentActor } from '../../ports/current-actor.port';

export interface GetWorkoutSessionInput {
  sessionId: string;
}

export interface GetWorkoutSessionOutput {
  id: string;
  userId: string;
  routineId: string;
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

/**
 * GetWorkoutSession use case.
 * Retrieves session details by ID for the current actor.
 */
export class GetWorkoutSessionUseCase {
  constructor(
    private readonly workoutSessionRepository: WorkoutSessionRepository,
  ) {}

  public async execute(
    actor: CurrentActor,
    input: GetWorkoutSessionInput,
  ): Promise<GetWorkoutSessionOutput> {
    const session = await this.workoutSessionRepository.findById(
      input.sessionId,
    );

    if (!session || session.userId !== actor.userId) {
      throw new WorkoutSessionDomainError(
        WorkoutSessionErrorCode.SESSION_NOT_FOUND,
        'Workout session not found',
        { sessionId: input.sessionId },
      );
    }

    return {
      id: session.id,
      userId: session.userId,
      routineId: session.routineId,
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
}
