import { WorkoutSession } from '../../../domain/entities/workout-session.entity';
import { WorkoutExercise } from '../../../domain/value-objects/workout-exercise.value-object';
import type { DayOfWeek } from '../../../domain/value-objects/routine-day.value-object';
import {
  WorkoutSessionDomainError,
  WorkoutSessionErrorCode,
} from '../../../domain/errors/workout-session-domain.error';
import { RoutineRepository } from '../../../domain/repositories/routine.repository';
import { WorkoutSessionRepository } from '../../../domain/repositories/workout-session.repository.port';
import { CurrentActor } from '../../ports/current-actor.port';
import {
  mapWorkoutSessionToOutput,
  WorkoutSessionOutput,
} from '../workout-session-output.mapper';

export const WORKOUT_SESSION_REPOSITORY_PORT = Symbol(
  'WORKOUT_SESSION_REPOSITORY_PORT',
);
export const ROUTINE_REPOSITORY_PORT_FOR_SESSION = Symbol(
  'ROUTINE_REPOSITORY_PORT_FOR_SESSION',
);

export interface StartWorkoutSessionInput {
  routineId: string;
  dayOfWeek: DayOfWeek;
}

export type StartWorkoutSessionOutput = WorkoutSessionOutput;

/**
 * StartWorkoutSession use case (RF-12, RF-12.0.1).
 * Validates that the user has an active routine,
 * validates that no other session is in progress for the user,
 * creates a new WorkoutSession in IN_PROGRESS state,
 * loads exercises from the routine's current day configuration into the session.
 */
export class StartWorkoutSessionUseCase {
  constructor(
    private readonly workoutSessionRepository: WorkoutSessionRepository,
    private readonly routineRepository: RoutineRepository,
  ) {}

  public async execute(
    actor: CurrentActor,
    input: StartWorkoutSessionInput,
  ): Promise<StartWorkoutSessionOutput> {
    // Validate that the routine exists and belongs to the user
    const routine = await this.routineRepository.findById(input.routineId);
    if (!routine || routine.userId !== actor.userId) {
      throw new WorkoutSessionDomainError(
        WorkoutSessionErrorCode.SESSION_NO_ACTIVE_ROUTINE,
        'No active routine found for this user',
        { routineId: input.routineId, userId: actor.userId },
      );
    }

    if (!routine.isActive) {
      throw new WorkoutSessionDomainError(
        WorkoutSessionErrorCode.SESSION_NO_ACTIVE_ROUTINE,
        'Routine is not active for this user',
        { routineId: input.routineId, userId: actor.userId },
      );
    }

    // Validate that no other session is in progress for the user (RF-12)
    const existingSession =
      await this.workoutSessionRepository.findInProgressByUserId(actor.userId);
    if (existingSession) {
      throw new WorkoutSessionDomainError(
        WorkoutSessionErrorCode.SESSION_ALREADY_IN_PROGRESS,
        'User already has a workout session in progress',
        { userId: actor.userId, existingSessionId: existingSession.id },
      );
    }

    const selectedDay = routine.days.find(
      (day) => day.dayOfWeek === input.dayOfWeek,
    );

    if (!selectedDay) {
      throw new WorkoutSessionDomainError(
        WorkoutSessionErrorCode.SESSION_DAY_NOT_FOUND,
        `Routine does not have training day "${input.dayOfWeek}"`,
        { routineId: routine.id, dayOfWeek: input.dayOfWeek },
      );
    }

    if (selectedDay.exercises.length === 0) {
      throw new WorkoutSessionDomainError(
        WorkoutSessionErrorCode.SESSION_DAY_HAS_NO_EXERCISES,
        `Routine day "${input.dayOfWeek}" has no exercises`,
        { routineId: routine.id, dayOfWeek: input.dayOfWeek },
      );
    }

    // Load only the selected routine day into the session snapshot.
    const workoutExercises = [...selectedDay.exercises]
      .sort((a, b) => a.order - b.order)
      .map((exercise) => {
        const targetSets =
          exercise.sets.length > 0
            ? [...exercise.sets]
                .sort((a, b) => a.setNumber - b.setNumber)
                .map((s) => ({
                  setNumber: s.setNumber,
                  reps: s.reps,
                  weight: s.weight,
                }))
            : [
                { setNumber: 1, reps: 10, weight: 0 },
                { setNumber: 2, reps: 10, weight: 0 },
                { setNumber: 3, reps: 10, weight: 0 },
              ];

        return WorkoutExercise.create(
          exercise.id,
          exercise.name,
          exercise.order + 1,
          targetSets,
        );
      });

    const sessionId = crypto.randomUUID();
    const session = WorkoutSession.create(
      sessionId,
      actor.userId,
      input.routineId,
      workoutExercises,
      input.dayOfWeek,
    );

    const saved = await this.workoutSessionRepository.save(session);

    return mapWorkoutSessionToOutput(saved);
  }
}
