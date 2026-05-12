import {
  WorkoutSessionDomainError,
  WorkoutSessionErrorCode,
} from '../../../domain/errors/workout-session-domain.error';
import { WorkoutSessionRepository } from '../../../domain/repositories/workout-session.repository.port';
import { CurrentActor } from '../../ports/current-actor.port';

export const MARK_SET_AS_COMPLETED_PORT = Symbol('MARK_SET_AS_COMPLETED_PORT');

export interface MarkSetAsCompletedInput {
  sessionId: string;
  exerciseIndex: number;
  setNumber: number;
}

export interface MarkSetAsCompletedOutput {
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
 * MarkSetAsCompleted use case (RF-12.0.3).
 * Validates session exists and is IN_PROGRESS,
 * validates exerciseIndex and setNumber,
 * delegates to WorkoutSession.markSetAsCompleted,
 * saves updated session.
 */
export class MarkSetAsCompletedUseCase {
  constructor(
    private readonly workoutSessionRepository: WorkoutSessionRepository,
  ) {}

  public async execute(
    actor: CurrentActor,
    input: MarkSetAsCompletedInput,
  ): Promise<MarkSetAsCompletedOutput> {
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

    const updatedSession = session.markSetAsCompleted(
      input.exerciseIndex,
      input.setNumber,
    );

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
          targetReps: ws.targetReps,
          targetWeight: ws.targetWeight,
          completed: ws.completed,
        })),
      })),
      startedAt: saved.startedAt,
      finishedAt: saved.finishedAt,
    };
  }
}
