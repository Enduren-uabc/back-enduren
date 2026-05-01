import { WorkoutSessionStatus } from '../value-objects/workout-session-status.value-object';
import { WorkoutExercise } from '../value-objects/workout-exercise.value-object';
import {
  WorkoutSessionDomainError,
  WorkoutSessionErrorCode,
} from '../errors/workout-session-domain.error';

/**
 * WorkoutSession domain entity — aggregate root.
 * Represents a workout session started from an active routine.
 * State transitions: IN_PROGRESS → FINISHED.
 * Immutable after finishing.
 * Enforces: requires userId and routineId, starts in IN_PROGRESS state.
 */
export class WorkoutSession {
  public readonly id: string;
  public readonly userId: string;
  public readonly routineId: string;
  public readonly status: WorkoutSessionStatus;
  public readonly exercises: WorkoutExercise[];
  public readonly startedAt: Date;
  public readonly finishedAt: Date | null;

  private constructor(
    id: string,
    userId: string,
    routineId: string,
    status: WorkoutSessionStatus,
    exercises: WorkoutExercise[],
    startedAt: Date,
    finishedAt: Date | null,
  ) {
    this.id = id;
    this.userId = userId;
    this.routineId = routineId;
    this.status = status;
    this.exercises = exercises;
    this.startedAt = startedAt;
    this.finishedAt = finishedAt;
  }

  /**
   * Creates a new WorkoutSession in IN_PROGRESS state.
   * Enforces: userId and routineId are required.
   */
  public static create(
    id: string,
    userId: string,
    routineId: string,
    exercises: WorkoutExercise[],
  ): WorkoutSession {
    if (!userId || userId.trim().length === 0) {
      throw new WorkoutSessionDomainError(
        WorkoutSessionErrorCode.SESSION_NO_ACTIVE_ROUTINE,
        'User ID is required to start a workout session',
        { userId },
      );
    }

    if (!routineId || routineId.trim().length === 0) {
      throw new WorkoutSessionDomainError(
        WorkoutSessionErrorCode.SESSION_NO_ACTIVE_ROUTINE,
        'Routine ID is required to start a workout session',
        { routineId },
      );
    }

    const now = new Date();
    return new WorkoutSession(
      id,
      userId,
      routineId,
      WorkoutSessionStatus.IN_PROGRESS,
      [...exercises],
      now,
      null,
    );
  }

  /**
   * Reconstitutes a WorkoutSession from persistence without re-running creation invariants.
   */
  public static reconstitute(
    id: string,
    userId: string,
    routineId: string,
    status: WorkoutSessionStatus,
    exercises: WorkoutExercise[],
    startedAt: Date,
    finishedAt: Date | null,
  ): WorkoutSession {
    return new WorkoutSession(
      id,
      userId,
      routineId,
      status,
      [...exercises],
      startedAt,
      finishedAt,
    );
  }

  /**
   * Transitions session from IN_PROGRESS to FINISHED.
   * Records finishedAt timestamp.
   * Throws if session is already finished or not in progress.
   */
  public finish(): WorkoutSession {
    if (this.status === WorkoutSessionStatus.FINISHED) {
      throw new WorkoutSessionDomainError(
        WorkoutSessionErrorCode.SESSION_ALREADY_FINISHED,
        'Workout session is already finished',
        { sessionId: this.id },
      );
    }

    return new WorkoutSession(
      this.id,
      this.userId,
      this.routineId,
      WorkoutSessionStatus.FINISHED,
      [...this.exercises],
      this.startedAt,
      new Date(),
    );
  }

  /**
   * Checks whether this session is in progress.
   */
  public isInProgress(): boolean {
    return this.status === WorkoutSessionStatus.IN_PROGRESS;
  }

  /**
   * Checks whether this session is finished.
   */
  public isFinished(): boolean {
    return this.status === WorkoutSessionStatus.FINISHED;
  }
}
