import {
  WorkoutSessionDomainError,
  WorkoutSessionErrorCode,
} from '../errors/workout-session-domain.error';

/**
 * WorkoutSet value object.
 * Represents a single set within an exercise in a workout session.
 * Contains: setNumber, repsPerformed (nullable), weightUsed (nullable), completed (defaults false).
 * Immutable: registerRepsAndWeight() and markAsCompleted() return new instances.
 */
export class WorkoutSet {
  public readonly setNumber: number;
  public readonly repsPerformed: number | null;
  public readonly weightUsed: number | null;
  public readonly completed: boolean;
  public readonly targetReps: number | null;
  public readonly targetWeight: number | null;

  private constructor(
    setNumber: number,
    repsPerformed: number | null,
    weightUsed: number | null,
    completed: boolean,
    targetReps: number | null,
    targetWeight: number | null,
  ) {
    this.setNumber = setNumber;
    this.repsPerformed = repsPerformed;
    this.weightUsed = weightUsed;
    this.completed = completed;
    this.targetReps = targetReps;
    this.targetWeight = targetWeight;
  }

  /**
   * Creates a new WorkoutSet with default values (pending/empty).
   * setNumber must be a positive integer.
   * targetReps and targetWeight are cloned from the routine's ExerciseSet.
   */
  public static create(
    setNumber: number,
    targetReps?: number,
    targetWeight?: number,
  ): WorkoutSet {
    if (!Number.isInteger(setNumber) || setNumber < 1) {
      throw new Error(
        `WorkoutSet setNumber must be a positive integer, got: ${setNumber}`,
      );
    }
    return new WorkoutSet(
      setNumber,
      null,
      null,
      false,
      targetReps ?? null,
      targetWeight ?? null,
    );
  }

  /**
   * Reconstitutes a WorkoutSet from persistence without re-running creation invariants.
   */
  public static reconstitute(
    setNumber: number,
    repsPerformed: number | null,
    weightUsed: number | null,
    completed: boolean,
    targetReps?: number | null,
    targetWeight?: number | null,
  ): WorkoutSet {
    return new WorkoutSet(
      setNumber,
      repsPerformed,
      weightUsed,
      completed,
      targetReps ?? null,
      targetWeight ?? null,
    );
  }

  /**
   * Registers the reps performed and weight used for this set.
   * Validates: repsPerformed must be a positive integer (1+), weightUsed must be >= 0.
   * Throws domain error if set is already completed.
   * Returns a new WorkoutSet with repsPerformed and weightUsed filled.
   */
  public registerRepsAndWeight(
    repsPerformed: number,
    weightUsed: number,
  ): WorkoutSet {
    if (this.completed) {
      throw new WorkoutSessionDomainError(
        WorkoutSessionErrorCode.SESSION_SET_ALREADY_COMPLETED,
        'Cannot register reps and weight for a completed set',
        { setNumber: this.setNumber },
      );
    }

    if (!Number.isInteger(repsPerformed) || repsPerformed < 1) {
      throw new WorkoutSessionDomainError(
        WorkoutSessionErrorCode.SESSION_SET_MISSING_REQUIRED_DATA,
        'repsPerformed must be a positive integer (1+)',
        { repsPerformed },
      );
    }

    if (typeof weightUsed !== 'number' || weightUsed < 0) {
      throw new WorkoutSessionDomainError(
        WorkoutSessionErrorCode.SESSION_SET_MISSING_REQUIRED_DATA,
        'weightUsed must be a number >= 0',
        { weightUsed },
      );
    }

    return new WorkoutSet(
      this.setNumber,
      repsPerformed,
      weightUsed,
      this.completed,
      this.targetReps,
      this.targetWeight,
    );
  }

  /**
   * Marks this set as completed.
   * If actual reps/weight are empty, uses the planned target values.
   * Throws domain error only when neither actual nor target data is available.
   */
  public markAsCompleted(): WorkoutSet {
    const repsPerformed = this.repsPerformed ?? this.targetReps;
    const weightUsed = this.weightUsed ?? this.targetWeight;

    if (repsPerformed === null || weightUsed === null) {
      throw new WorkoutSessionDomainError(
        WorkoutSessionErrorCode.SESSION_SET_MISSING_REQUIRED_DATA,
        'Cannot mark set as completed without actual or target reps and weight',
        { setNumber: this.setNumber },
      );
    }

    return new WorkoutSet(
      this.setNumber,
      repsPerformed,
      weightUsed,
      true,
      this.targetReps,
      this.targetWeight,
    );
  }

  public equals(other: WorkoutSet): boolean {
    return (
      this.setNumber === other.setNumber &&
      this.repsPerformed === other.repsPerformed &&
      this.weightUsed === other.weightUsed &&
      this.completed === other.completed &&
      this.targetReps === other.targetReps &&
      this.targetWeight === other.targetWeight
    );
  }
}
