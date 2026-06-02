import {
  RoutineDomainError,
  RoutineErrorCode,
} from '../errors/routine-domain.error';
import { RoutineExerciseSet } from '../value-objects/routine-exercise-set.value-object';

/**
 * Exercise domain entity.
 * Represents a single exercise within a routine day.
 * Has identity (id) and can be referenced for removal.
 * RF-10: Add exercise to an existing routine.
 * RF-11: Configure exercise sets, reps and weight.
 */
export class Exercise {
  public readonly id: string;
  public readonly name: string;
  public readonly order: number;
  public readonly sets: RoutineExerciseSet[];
  public readonly catalogId: string | null;

  private constructor(
    id: string,
    name: string,
    order: number,
    sets: RoutineExerciseSet[],
    catalogId: string | null,
  ) {
    this.id = id;
    this.name = name;
    this.order = order;
    this.sets = sets;
    this.catalogId = catalogId;
  }

  /**
   * Creates a new Exercise with core invariants enforced:
   * - Name must be non-empty (RF-10).
   */
  public static create(
    id: string,
    name: string,
    order: number,
    catalogId?: string | null,
  ): Exercise {
    if (!name || name.trim().length === 0) {
      throw new RoutineDomainError(
        RoutineErrorCode.EXERCISE_NAME_REQUIRED,
        'Exercise name is required',
        { name },
      );
    }

    return new Exercise(id, name.trim(), order, [], catalogId ?? null);
  }

  /**
   * Reconstitutes an Exercise from persistence without re-running creation invariants.
   */
  public static reconstitute(
    id: string,
    name: string,
    order: number,
    sets: RoutineExerciseSet[] = [],
    catalogId: string | null = null,
  ): Exercise {
    return new Exercise(id, name, order, sets, catalogId);
  }

  /**
   * Configures this exercise with an array of detailed sets.
   * Returns a new Exercise with the sets applied (immutable pattern).
   * Invariants: at least 1 set, reps >= 1, weight >= 0.
   */
  public configureSets(sets: RoutineExerciseSet[]): Exercise {
    if (sets.length === 0) {
      throw new RoutineDomainError(
        RoutineErrorCode.EXERCISE_SETS_OUT_OF_RANGE,
        'Exercise must have at least 1 set',
        { setCount: sets.length },
      );
    }

    return new Exercise(
      this.id,
      this.name,
      this.order,
      [...sets],
      this.catalogId,
    );
  }
}
