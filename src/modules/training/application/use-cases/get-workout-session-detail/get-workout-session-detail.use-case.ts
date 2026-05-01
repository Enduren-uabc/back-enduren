import {
  WorkoutSessionDomainError,
  WorkoutSessionErrorCode,
} from '../../../domain/errors/workout-session-domain.error';
import { WorkoutSessionRepository } from '../../../domain/repositories/workout-session.repository.port';
import { RoutineRepository } from '../../../domain/repositories/routine.repository';
import { CurrentActor } from '../../ports/current-actor.port';

export interface GetWorkoutSessionDetailInput {
  sessionId: string;
}

export interface WorkoutSessionDetailOutput {
  id: string;
  userId: string;
  routineId: string;
  routineName: string;
  status: string;
  currentExerciseIndex: number;
  exercises: Array<{
    exerciseId: string;
    exerciseName: string;
    order: number;
    sets: number;
    repsPerSet: number;
    weight: number;
    workoutSets: Array<{
      setNumber: number;
      repsPerformed: number | null;
      weightUsed: number | null;
      completed: boolean;
    }>;
  }>;
  startedAt: Date;
  finishedAt: Date | null;
  durationMinutes: number | null;
}

/**
 * GetWorkoutSessionDetail use case (RF-13.0.2).
 * Returns the full detail of a specific workout session,
 * including exercises, sets, computed duration, and routine name.
 * Validates session ownership (SESSION_NOT_OWNED if user does not own the session).
 */
export class GetWorkoutSessionDetailUseCase {
  constructor(
    private readonly workoutSessionRepository: WorkoutSessionRepository,
    private readonly routineRepository: RoutineRepository,
  ) {}

  public async execute(
    actor: CurrentActor,
    input: GetWorkoutSessionDetailInput,
  ): Promise<WorkoutSessionDetailOutput> {
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
        WorkoutSessionErrorCode.SESSION_NOT_OWNED,
        'Workout session does not belong to this user',
        { sessionId: input.sessionId, userId: actor.userId },
      );
    }

    // Resolve routine name
    const routine = await this.routineRepository.findById(session.routineId);
    const routineName = routine?.name ?? 'Unknown Routine';

    // Compute duration for finished sessions
    const durationMinutes =
      session.finishedAt && session.startedAt
        ? Math.round(
            ((session.finishedAt.getTime() - session.startedAt.getTime()) /
              60000) *
              10,
          ) / 10
        : null;

    return {
      id: session.id,
      userId: session.userId,
      routineId: session.routineId,
      routineName,
      status: session.status,
      currentExerciseIndex: session.currentExerciseIndex,
      exercises: session.exercises.map((ex) => ({
        exerciseId: ex.exerciseId,
        exerciseName: ex.exerciseName,
        order: ex.order,
        sets: ex.sets,
        repsPerSet: ex.repsPerSet,
        weight: ex.weight,
        workoutSets: ex.workoutSets.map((ws) => ({
          setNumber: ws.setNumber,
          repsPerformed: ws.repsPerformed,
          weightUsed: ws.weightUsed,
          completed: ws.completed,
        })),
      })),
      startedAt: session.startedAt,
      finishedAt: session.finishedAt,
      durationMinutes,
    };
  }
}
