import {
  WorkoutSessionDomainError,
  WorkoutSessionErrorCode,
} from '../../../domain/errors/workout-session-domain.error';
import { WorkoutSessionRepository } from '../../../domain/repositories/workout-session.repository.port';
import { CurrentActor } from '../../ports/current-actor.port';

export interface FinishWorkoutSessionInput {
  sessionId: string;
}

export interface FinishWorkoutSessionOutput {
  id: string;
  userId: string;
  routineId: string;
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
  finishedAt: Date;
}

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
      startedAt: saved.startedAt,
      finishedAt: saved.finishedAt!,
    };
  }
}
