import { WorkoutSession } from '../../../domain/entities/workout-session.entity';
import {
  WorkoutSessionDomainError,
  WorkoutSessionErrorCode,
} from '../../../domain/errors/workout-session-domain.error';
import { RoutineRepository } from '../../../domain/repositories/routine.repository';
import { WorkoutSessionRepository } from '../../../domain/repositories/workout-session.repository.port';
import { CurrentActor } from '../../ports/current-actor.port';

export const WORKOUT_SESSION_REPOSITORY_PORT = Symbol(
  'WORKOUT_SESSION_REPOSITORY_PORT',
);
export const ROUTINE_REPOSITORY_PORT_FOR_SESSION = Symbol(
  'ROUTINE_REPOSITORY_PORT_FOR_SESSION',
);

export interface StartWorkoutSessionInput {
  routineId: string;
}

export interface StartWorkoutSessionOutput {
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

    // Load exercises from the routine configuration (RF-12.0.1)
    const { WorkoutExercise } =
      await import('../../../domain/value-objects/workout-exercise.value-object');
    const workoutExercises = routine.days.flatMap((day) =>
      day.exercises.map((exercise) => {
        const targetSets =
          exercise.sets.length > 0
            ? exercise.sets.map((s) => ({
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
      }),
    );

    const sessionId = crypto.randomUUID();
    const session = WorkoutSession.create(
      sessionId,
      actor.userId,
      input.routineId,
      workoutExercises,
    );

    const saved = await this.workoutSessionRepository.save(session);

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
