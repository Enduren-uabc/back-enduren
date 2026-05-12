import {
  WorkoutSessionDomainError,
  WorkoutSessionErrorCode,
} from '../../../domain/errors/workout-session-domain.error';
import { WorkoutSessionRepository } from '../../../domain/repositories/workout-session.repository.port';
import { CurrentActor } from '../../ports/current-actor.port';

export const ADVANCE_TO_NEXT_EXERCISE_PORT = Symbol(
  'ADVANCE_TO_NEXT_EXERCISE_PORT',
);

export interface AdvanceToNextExerciseInput {
  sessionId: string;
}

export interface AdvanceToNextExerciseOutput {
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
      completed: boolean;
    }>;
  }>;
  startedAt: Date;
  finishedAt: Date | null;
}

/**
 * AdvanceToNextExercise use case (RF-12.0.4).
 * Validates session exists and is IN_PROGRESS,
 * validates all sets of current exercise are completed,
 * delegates to WorkoutSession.advanceToNextExercise,
 * saves updated session.
 */
export class AdvanceToNextExerciseUseCase {
  constructor(
    private readonly workoutSessionRepository: WorkoutSessionRepository,
  ) {}

  public async execute(
    actor: CurrentActor,
    input: AdvanceToNextExerciseInput,
  ): Promise<AdvanceToNextExerciseOutput> {
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

    if (!session.isInProgress()) {
      throw new WorkoutSessionDomainError(
        WorkoutSessionErrorCode.SESSION_ALREADY_FINISHED,
        'Workout session is already finished',
        { sessionId: input.sessionId },
      );
    }

    const updatedSession = session.advanceToNextExercise();

    const saved = await this.workoutSessionRepository.save(updatedSession);

    return {
      id: saved.id,
      userId: saved.userId,
      routineId: saved.routineId,
      status: saved.status,
      currentExerciseIndex: saved.currentExerciseIndex,
      exercises: saved.exercises.map((ex) => ({
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
          completed: ws.completed,
        })),
      })),
      startedAt: saved.startedAt,
      finishedAt: saved.finishedAt,
    };
  }
}
