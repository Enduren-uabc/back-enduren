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

export interface FinishWorkoutSessionInput {
  sessionId: string;
}

export type FinishWorkoutSessionOutput = WorkoutSessionOutput;

/**
 * FinishWorkoutSession use case (RF-12.0.5, RF-12.0.6).
 * Transitions session from IN_PROGRESS to FINISHED,
 * records finishedAt timestamp,
 * saves complete record including all exercises and their set states.
 */
export class FinishWorkoutSessionUseCase {
  constructor(
    private readonly workoutSessionRepository: WorkoutSessionRepository,
  ) {}

  public async execute(
    actor: CurrentActor,
    input: FinishWorkoutSessionInput,
  ): Promise<FinishWorkoutSessionOutput> {
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
        'Workout session is already finished',
        { sessionId: input.sessionId },
      );
    }

    const finishedSession = session.finish();

    const saved = await this.workoutSessionRepository.save(finishedSession);

    return mapWorkoutSessionToOutput(saved);
  }
}
