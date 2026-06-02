import {
  WorkoutSessionDomainError,
  WorkoutSessionErrorCode,
} from '../../../domain/errors/workout-session-domain.error';
import { WorkoutSessionRepository } from '../../../domain/repositories/workout-session.repository.port';
import { CurrentActor } from '../../ports/current-actor.port';
import {
  mapWorkoutSessionToOutput,
  WorkoutSessionOutput,
} from '../workout-session-output.mapper';

export const MARK_SET_AS_COMPLETED_PORT = Symbol('MARK_SET_AS_COMPLETED_PORT');

export interface MarkSetAsCompletedInput {
  sessionId: string;
  exerciseIndex: number;
  setNumber: number;
}

export type MarkSetAsCompletedOutput = WorkoutSessionOutput;

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

    if (session?.userId !== actor.userId) {
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

    const updatedSession = session.toggleSetCompleted(
      input.exerciseIndex,
      input.setNumber,
    );

    const saved = await this.workoutSessionRepository.save(updatedSession);

    return mapWorkoutSessionToOutput(saved);
  }
}
