import {
  RoutineDomainError,
  RoutineErrorCode,
} from '../errors/routine-domain.error';

/**
 * ExerciseConfiguration value object.
 * Enforces configuration invariants for an exercise:
 * - sets: integer 1-10 (RF-11.0.1)
 * - repsPerSet: integer 1-50 (RF-11.0.2)
 * - weight: number >= 0 (RF-11.0.3)
 * - Combined validation rejects any out-of-range value (RF-11.0.4)
 */
export class ExerciseConfiguration {
  public readonly sets: number;
  public readonly repsPerSet: number;
  public readonly weight: number;

  private constructor(sets: number, repsPerSet: number, weight: number) {
    this.sets = sets;
    this.repsPerSet = repsPerSet;
    this.weight = weight;
  }

  /**
   * Creates an ExerciseConfiguration with all invariants enforced.
   * Throws RoutineDomainError for any out-of-range value.
   */
  public static create(
    sets: number,
    repsPerSet: number,
    weight: number,
  ): ExerciseConfiguration {
    if (!Number.isInteger(sets) || sets < 1 || sets > 10) {
      throw new RoutineDomainError(
        RoutineErrorCode.EXERCISE_SETS_OUT_OF_RANGE,
        'Sets must be an integer between 1 and 10',
        { sets },
      );
    }

    if (!Number.isInteger(repsPerSet) || repsPerSet < 1 || repsPerSet > 50) {
      throw new RoutineDomainError(
        RoutineErrorCode.EXERCISE_REPS_OUT_OF_RANGE,
        'Reps per set must be an integer between 1 and 50',
        { repsPerSet },
      );
    }

    if (typeof weight !== 'number' || weight < 0) {
      throw new RoutineDomainError(
        RoutineErrorCode.EXERCISE_WEIGHT_INVALID,
        'Weight must be a number >= 0',
        { weight },
      );
    }

    return new ExerciseConfiguration(sets, repsPerSet, weight);
  }

  /**
   * Reconstitutes an ExerciseConfiguration from persistence without re-running creation invariants.
   */
  public static reconstitute(
    sets: number,
    repsPerSet: number,
    weight: number,
  ): ExerciseConfiguration {
    return new ExerciseConfiguration(sets, repsPerSet, weight);
  }

  public equals(other: ExerciseConfiguration): boolean {
    return (
      this.sets === other.sets &&
      this.repsPerSet === other.repsPerSet &&
      this.weight === other.weight
    );
  }
}
