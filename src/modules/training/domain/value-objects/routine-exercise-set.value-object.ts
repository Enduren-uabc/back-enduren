import {
  RoutineDomainError,
  RoutineErrorCode,
} from '../errors/routine-domain.error';

/**
 * RoutineExerciseSet value object.
 * Represents a single set within an exercise in a routine.
 * Contains: id, setNumber, reps, weight, restSeconds (optional).
 * Immutable.
 */
export class RoutineExerciseSet {
  public readonly id: string;
  public readonly setNumber: number;
  public readonly reps: number;
  public readonly weight: number;
  public readonly restSeconds: number | null;

  private constructor(
    id: string,
    setNumber: number,
    reps: number,
    weight: number,
    restSeconds: number | null,
  ) {
    this.id = id;
    this.setNumber = setNumber;
    this.reps = reps;
    this.weight = weight;
    this.restSeconds = restSeconds;
  }

  /**
   * Creates a RoutineExerciseSet with all invariants enforced:
   * - setNumber: positive integer
   * - reps: integer >= 1
   * - weight: number >= 0
   */
  public static create(
    setNumber: number,
    reps: number,
    weight: number,
    restSeconds?: number,
  ): RoutineExerciseSet {
    if (!Number.isInteger(setNumber) || setNumber < 1) {
      throw new RoutineDomainError(
        RoutineErrorCode.EXERCISE_SETS_OUT_OF_RANGE,
        'Set number must be a positive integer',
        { setNumber },
      );
    }

    if (!Number.isInteger(reps) || reps < 1) {
      throw new RoutineDomainError(
        RoutineErrorCode.EXERCISE_REPS_OUT_OF_RANGE,
        'Reps must be an integer >= 1',
        { reps },
      );
    }

    if (typeof weight !== 'number' || weight < 0) {
      throw new RoutineDomainError(
        RoutineErrorCode.EXERCISE_WEIGHT_INVALID,
        'Weight must be a number >= 0',
        { weight },
      );
    }

    if (
      restSeconds !== undefined &&
      (!Number.isInteger(restSeconds) || restSeconds < 0)
    ) {
      throw new RoutineDomainError(
        RoutineErrorCode.EXERCISE_WEIGHT_INVALID,
        'Rest seconds must be a non-negative integer',
        { restSeconds },
      );
    }

    return new RoutineExerciseSet(
      crypto.randomUUID(),
      setNumber,
      reps,
      weight,
      restSeconds ?? null,
    );
  }

  /**
   * Reconstitutes a RoutineExerciseSet from persistence without re-running creation invariants.
   */
  public static reconstitute(
    id: string,
    setNumber: number,
    reps: number,
    weight: number,
    restSeconds: number | null,
  ): RoutineExerciseSet {
    return new RoutineExerciseSet(id, setNumber, reps, weight, restSeconds);
  }

  public equals(other: RoutineExerciseSet): boolean {
    return (
      this.setNumber === other.setNumber &&
      this.reps === other.reps &&
      this.weight === other.weight &&
      this.restSeconds === other.restSeconds
    );
  }
}
