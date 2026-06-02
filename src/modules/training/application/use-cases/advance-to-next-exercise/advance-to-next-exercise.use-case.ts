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

export const ADVANCE_TO_NEXT_EXERCISE_PORT = Symbol(
  'ADVANCE_TO_NEXT_EXERCISE_PORT',
);

export interface AdvanceToNextExerciseInput {
  sessionId: string;
  allowIncomplete?: boolean;
}

export type AdvanceToNextExerciseOutput = WorkoutSessionOutput;

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

    const updatedSession = session.advanceToNextExercise(
      input.allowIncomplete === true,
    );

    const saved = await this.workoutSessionRepository.save(updatedSession);

    return mapWorkoutSessionToOutput(saved);
  }
}
