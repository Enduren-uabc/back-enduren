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

export interface DiscardWorkoutSessionInput {
  sessionId: string;
}

export type DiscardWorkoutSessionOutput = WorkoutSessionOutput;

/**
 * DiscardWorkoutSession use case.
 * Transitions session from IN_PROGRESS to DISCARDED,
 * records finishedAt timestamp,
 * saves the final state.
 * Used when the user wants to discard an in-progress session
 * without saving any data.
 */
export class DiscardWorkoutSessionUseCase {
  constructor(
    private readonly workoutSessionRepository: WorkoutSessionRepository,
  ) {}

  public async execute(
    actor: CurrentActor,
    input: DiscardWorkoutSessionInput,
  ): Promise<DiscardWorkoutSessionOutput> {
    const session = await this.workoutSessionRepository.findById(
      input.sessionId,
    );

    if (!session) {
      throw new WorkoutSessionDomainError(
        WorkoutSessionErrorCode.SESSION_NOT_FOUND,
        'Workout session not found',
        { sessionId: input.sessionId },
      );
    }

    if (session.userId !== actor.userId) {
      throw new WorkoutSessionDomainError(
        WorkoutSessionErrorCode.SESSION_NOT_FOUND,
        'Workout session not found',
        { sessionId: input.sessionId },
      );
    }

    if (!session.isInProgress()) {
      throw new WorkoutSessionDomainError(
        WorkoutSessionErrorCode.SESSION_ALREADY_FINISHED,
        'Workout session is not in progress and cannot be discarded',
        { sessionId: input.sessionId, status: session.status },
      );
    }

    const discardedSession = session.discard();

    const saved = await this.workoutSessionRepository.save(discardedSession);

    return mapWorkoutSessionToOutput(saved);
  }
}
