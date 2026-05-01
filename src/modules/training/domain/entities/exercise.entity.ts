import {
  RoutineDomainError,
  RoutineErrorCode,
} from '../errors/routine-domain.error';

/**
 * Exercise domain entity.
 * Represents a single exercise within a routine day.
 * Has identity (id) and can be referenced for removal.
 * RF-10: Add exercise to an existing routine.
 */
export class Exercise {
  public readonly id: string;
  public readonly name: string;
  public readonly order: number;

  private constructor(id: string, name: string, order: number) {
    this.id = id;
    this.name = name;
    this.order = order;
  }

  /**
   * Creates a new Exercise with core invariants enforced:
   * - Name must be non-empty (RF-10).
   */
  public static create(id: string, name: string, order: number): Exercise {
    if (!name || name.trim().length === 0) {
      throw new RoutineDomainError(
        RoutineErrorCode.EXERCISE_NAME_REQUIRED,
        'Exercise name is required',
        { name },
      );
    }

    return new Exercise(id, name.trim(), order);
  }

  /**
   * Reconstitutes an Exercise from persistence without re-running creation invariants.
   */
  public static reconstitute(
    id: string,
    name: string,
    order: number,
  ): Exercise {
    return new Exercise(id, name, order);
  }
}
