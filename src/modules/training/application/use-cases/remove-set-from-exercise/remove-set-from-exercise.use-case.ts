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

export const REMOVE_SET_FROM_EXERCISE_PORT = Symbol(
  'REMOVE_SET_FROM_EXERCISE_PORT',
);

export interface RemoveSetFromExerciseInput {
  sessionId: string;
  exerciseIndex: number;
  setNumber: number;
}

export type RemoveSetFromExerciseOutput = WorkoutSessionOutput;

export class RemoveSetFromExerciseUseCase {
  constructor(
    private readonly workoutSessionRepository: WorkoutSessionRepository,
  ) {}

  public async execute(
    actor: CurrentActor,
    input: RemoveSetFromExerciseInput,
  ): Promise<RemoveSetFromExerciseOutput> {
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

    const updatedSession = session.removeSetFromExercise(
      input.exerciseIndex,
      input.setNumber,
    );

    const saved = await this.workoutSessionRepository.save(updatedSession);

    return mapWorkoutSessionToOutput(saved);
  }
}
