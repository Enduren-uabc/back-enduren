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

export const ADD_SET_TO_EXERCISE_PORT = Symbol('ADD_SET_TO_EXERCISE_PORT');

export interface AddSetToExerciseInput {
  sessionId: string;
  exerciseIndex: number;
  reps: number;
  weight: number;
}

export type AddSetToExerciseOutput = WorkoutSessionOutput;

export class AddSetToExerciseUseCase {
  constructor(
    private readonly workoutSessionRepository: WorkoutSessionRepository,
  ) {}

  public async execute(
    actor: CurrentActor,
    input: AddSetToExerciseInput,
  ): Promise<AddSetToExerciseOutput> {
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

    const updatedSession = session.addSetToExercise(
      input.exerciseIndex,
      input.reps,
      input.weight,
    );

    const saved = await this.workoutSessionRepository.save(updatedSession);

    return mapWorkoutSessionToOutput(saved);
  }
}
