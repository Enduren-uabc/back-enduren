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

export type ResumeWorkoutSessionOutput = WorkoutSessionOutput;

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

    return mapWorkoutSessionToOutput(session);
  }
}
