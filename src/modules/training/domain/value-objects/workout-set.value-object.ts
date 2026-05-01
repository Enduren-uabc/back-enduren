/**
 * WorkoutSet value object.
 * Represents a single set within an exercise in a workout session.
 * Contains: setNumber, repsPerformed (nullable), weightUsed (nullable), completed (defaults false).
 * RF-12.0.2 and RF-12.0.3 are deferred to CYCLE-006; this value object captures the structure.
 */
export class WorkoutSet {
  public readonly setNumber: number;
  public readonly repsPerformed: number | null;
  public readonly weightUsed: number | null;
  public readonly completed: boolean;

  private constructor(
    setNumber: number,
    repsPerformed: number | null,
    weightUsed: number | null,
    completed: boolean,
  ) {
    this.setNumber = setNumber;
    this.repsPerformed = repsPerformed;
    this.weightUsed = weightUsed;
    this.completed = completed;
  }

  /**
   * Creates a new WorkoutSet with default values (pending/empty).
   * setNumber must be a positive integer.
   */
  public static create(setNumber: number): WorkoutSet {
    if (!Number.isInteger(setNumber) || setNumber < 1) {
      throw new Error(
        `WorkoutSet setNumber must be a positive integer, got: ${setNumber}`,
      );
    }
    return new WorkoutSet(setNumber, null, null, false);
  }

  /**
   * Reconstitutes a WorkoutSet from persistence without re-running creation invariants.
   */
  public static reconstitute(
    setNumber: number,
    repsPerformed: number | null,
    weightUsed: number | null,
    completed: boolean,
  ): WorkoutSet {
    return new WorkoutSet(setNumber, repsPerformed, weightUsed, completed);
  }

  public equals(other: WorkoutSet): boolean {
    return (
      this.setNumber === other.setNumber &&
      this.repsPerformed === other.repsPerformed &&
      this.weightUsed === other.weightUsed &&
      this.completed === other.completed
    );
  }
}
