import {
  WorkoutSessionDomainError,
  WorkoutSessionErrorCode,
} from '../../../domain/errors/workout-session-domain.error';
import { WorkoutSessionRepository } from '../../../domain/repositories/workout-session.repository.port';
import { CurrentActor } from '../../ports/current-actor.port';

export interface ResumeWorkoutSessionOutput {
  id: string;
  userId: string;
  routineId: string;
  status: string;
  currentExerciseIndex: number;
  exercises: Array<{
    exerciseId: string;
    exerciseName: string;
    order: number;
    sets: number;
    repsPerSet: number;
    weight: number;
    workoutSets: Array<{
      setNumber: number;
      repsPerformed: number | null;
      weightUsed: number | null;
      completed: boolean;
    }>;
  }>;
  startedAt: Date;
  finishedAt: Date | null;
}

/**
 * ResumeWorkoutSession use case (RF-12.0.7).
 * Finds the user's in-progress session and returns it with
 * current exercise, completed sets, and pending sets restored.
 */
export class ResumeWorkoutSessionUseCase {
  constructor(
    private readonly workoutSessionRepository: WorkoutSessionRepository,
  ) {}

  public async execute(
    actor: CurrentActor,
  ): Promise<ResumeWorkoutSessionOutput> {
    const session = await this.workoutSessionRepository.findInProgressByUserId(
      actor.userId,
    );

    if (!session) {
      throw new WorkoutSessionDomainError(
        WorkoutSessionErrorCode.SESSION_NOT_IN_PROGRESS,
        'No workout session in progress for this user',
        { userId: actor.userId },
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
        sets: ex.sets,
        repsPerSet: ex.repsPerSet,
        weight: ex.weight,
        workoutSets: ex.workoutSets.map((ws) => ({
          setNumber: ws.setNumber,
          repsPerformed: ws.repsPerformed,
          weightUsed: ws.weightUsed,
          completed: ws.completed,
        })),
      })),
      startedAt: session.startedAt,
      finishedAt: session.finishedAt,
    };
  }
}
