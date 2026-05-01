import {
  RoutineDomainError,
  RoutineErrorCode,
} from '../errors/routine-domain.error';
import { Exercise } from '../entities/exercise.entity';

export type DayOfWeek =
  | 'monday'
  | 'tuesday'
  | 'wednesday'
  | 'thursday'
  | 'friday'
  | 'saturday'
  | 'sunday';

const VALID_DAYS_OF_WEEK: readonly DayOfWeek[] = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
];

export function isValidDayOfWeek(value: string): value is DayOfWeek {
  return VALID_DAYS_OF_WEEK.includes(value as DayOfWeek);
}

export const MAX_EXERCISES_PER_DAY = 10;

/**
 * RoutineDay value object.
 * Represents a single day within a routine.
 * Holds Exercise instances and enforces the max 10 exercises per day invariant (RF-10.0.4, RF-10.0.5).
 */
export class RoutineDay {
  public readonly dayOfWeek: DayOfWeek;
  public readonly exercises: Exercise[];

  private constructor(dayOfWeek: DayOfWeek, exercises: Exercise[]) {
    this.dayOfWeek = dayOfWeek;
    this.exercises = [...exercises];
  }

  /**
   * Derived exercise count from the exercises array.
   */
  public get exerciseCount(): number {
    return this.exercises.length;
  }

  /**
   * Creates a new RoutineDay with no exercises.
   */
  public static create(dayOfWeek: string): RoutineDay {
    if (!isValidDayOfWeek(dayOfWeek)) {
      throw new RoutineDomainError(
        RoutineErrorCode.ROUTINE_DAY_INVALID_DAY_OF_WEEK,
        `Invalid day of week: ${dayOfWeek}`,
        { dayOfWeek },
      );
    }
    return new RoutineDay(dayOfWeek, []);
  }

  /**
   * Reconstitutes a RoutineDay from persistence with exercises.
   */
  public static reconstitute(
    dayOfWeek: DayOfWeek,
    exercises: Exercise[],
  ): RoutineDay {
    return new RoutineDay(dayOfWeek, exercises);
  }

  /**
   * Adds an exercise to this day, enforcing the max 10 exercises per day invariant.
   * Returns a new RoutineDay with the exercise added.
   */
  public addExercise(exercise: Exercise): RoutineDay {
    if (this.exercises.length >= MAX_EXERCISES_PER_DAY) {
      throw new RoutineDomainError(
        RoutineErrorCode.EXERCISE_DAY_LIMIT_EXCEEDED,
        `Cannot exceed ${MAX_EXERCISES_PER_DAY} exercises per day`,
        { dayOfWeek: this.dayOfWeek, currentCount: this.exercises.length },
      );
    }
    return new RoutineDay(this.dayOfWeek, [...this.exercises, exercise]);
  }

  /**
   * Removes an exercise from this day by id.
   * Returns a new RoutineDay with the exercise removed.
   * Throws if exercise not found.
   */
  public removeExercise(exerciseId: string): RoutineDay {
    const index = this.exercises.findIndex((e) => e.id === exerciseId);
    if (index === -1) {
      throw new RoutineDomainError(
        RoutineErrorCode.EXERCISE_NOT_FOUND,
        `Exercise with id "${exerciseId}" not found in day ${this.dayOfWeek}`,
        { exerciseId, dayOfWeek: this.dayOfWeek },
      );
    }
    const updated = [...this.exercises];
    updated.splice(index, 1);
    return new RoutineDay(this.dayOfWeek, updated);
  }

  public equals(other: RoutineDay): boolean {
    return this.dayOfWeek === other.dayOfWeek;
  }
}
