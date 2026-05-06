import {
  RoutineDomainError,
  RoutineErrorCode,
} from '../errors/routine-domain.error';
import { ExerciseConfiguration } from '../value-objects/exercise-configuration.value-object';

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
  public readonly configuration: ExerciseConfiguration | null;

  private constructor(
    id: string,
    name: string,
    order: number,
    configuration: ExerciseConfiguration | null = null,
  ) {
    this.id = id;
    this.name = name;
    this.order = order;
    this.configuration = configuration;
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

    return new Exercise(id, name.trim(), order, null);
  }

  /**
   * Reconstitutes an Exercise from persistence without re-running creation invariants.
   */
  public static reconstitute(
    id: string,
    name: string,
    order: number,
    configuration: ExerciseConfiguration | null = null,
  ): Exercise {
    return new Exercise(id, name, order, configuration);
  }

  /**
   * Configures this exercise with sets, repsPerSet and weight.
   * Returns a new Exercise with the configuration applied (immutable pattern).
   * Delegates validation to ExerciseConfiguration value object (RF-11.0.1, RF-11.0.2, RF-11.0.3, RF-11.0.4).
   */
  public configure(sets: number, repsPerSet: number, weight: number): Exercise {
    const configuration = ExerciseConfiguration.create(
      sets,
      repsPerSet,
      weight,
    );
    return new Exercise(this.id, this.name, this.order, configuration);
  }
}
