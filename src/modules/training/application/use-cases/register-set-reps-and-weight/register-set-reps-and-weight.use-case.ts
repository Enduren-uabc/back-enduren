import {
  WorkoutSessionDomainError,
  WorkoutSessionErrorCode,
} from '../../../domain/errors/workout-session-domain.error';
import { WorkoutSessionRepository } from '../../../domain/repositories/workout-session.repository.port';
import { CurrentActor } from '../../ports/current-actor.port';

export const REGISTER_SET_REPS_AND_WEIGHT_PORT = Symbol(
  'REGISTER_SET_REPS_AND_WEIGHT_PORT',
);

export interface RegisterSetRepsAndWeightInput {
  sessionId: string;
  exerciseIndex: number;
  setNumber: number;
  repsPerformed: number;
  weightUsed: number;
}

export interface RegisterSetRepsAndWeightOutput {
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
  finishedAt: Date | null;
}

/**
 * RegisterSetRepsAndWeight use case (RF-12.0.2).
 * Validates session exists and is IN_PROGRESS,
 * validates exerciseIndex and setNumber are valid for the session,
 * delegates to WorkoutSession.registerSetRepsAndWeight,
 * saves updated session.
 */
export class RegisterSetRepsAndWeightUseCase {
  constructor(
    private readonly workoutSessionRepository: WorkoutSessionRepository,
  ) {}

  public async execute(
    actor: CurrentActor,
    input: RegisterSetRepsAndWeightInput,
  ): Promise<RegisterSetRepsAndWeightOutput> {
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

    const updatedSession = session.registerSetRepsAndWeight(
      input.exerciseIndex,
      input.setNumber,
      input.repsPerformed,
      input.weightUsed,
    );

    const saved = await this.workoutSessionRepository.save(updatedSession);

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
      finishedAt: saved.finishedAt,
    };
  }
}
