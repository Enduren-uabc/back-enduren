import {
  RoutineDomainError,
  RoutineErrorCode,
} from '../errors/routine-domain.error';
import { RoutineDay } from '../value-objects/routine-day.value-object';
import { Exercise } from './exercise.entity';

export class Routine {
  public readonly id: string;
  public readonly name: string;
  public readonly userId: string;
  public readonly days: RoutineDay[];
  public readonly createdAt: Date;
  public readonly updatedAt: Date;

  private constructor(
    id: string,
    name: string,
    userId: string,
    days: RoutineDay[],
    createdAt: Date,
    updatedAt: Date,
  ) {
    this.id = id;
    this.name = name;
    this.userId = userId;
    this.days = days;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }

  /**
   * Creates a new Routine with core invariants enforced:
   * - Name must be non-empty.
   * - At least one day is required.
   */
  public static create(
    id: string,
    name: string,
    userId: string,
    days: RoutineDay[],
  ): Routine {
    if (!name || name.trim().length === 0) {
      throw new RoutineDomainError(
        RoutineErrorCode.ROUTINE_NAME_REQUIRED,
        'Routine name is required',
        { name },
      );
    }

    if (!days || days.length === 0) {
      throw new RoutineDomainError(
        RoutineErrorCode.ROUTINE_DAYS_MINIMUM,
        'Routine must have at least one day',
        { daysCount: days?.length ?? 0 },
      );
    }

    const now = new Date();
    return new Routine(id, name.trim(), userId, [...days], now, now);
  }

  /**
   * Reconstitutes a Routine from persistence without re-running creation invariants.
   */
  public static reconstitute(
    id: string,
    name: string,
    userId: string,
    days: RoutineDay[],
    createdAt: Date,
    updatedAt: Date,
  ): Routine {
    return new Routine(id, name, userId, [...days], createdAt, updatedAt);
  }

  /**
   * Adds an exercise to a specific day of the routine.
   * Enforces: day must exist (RF-10.0.2), day must not exceed 10 exercises (RF-10.0.4, RF-10.0.5).
   * Returns a new Routine with the exercise added.
   */
  public addExerciseToDay(dayOfWeek: string, exercise: Exercise): Routine {
    const dayIndex = this.days.findIndex((d) => d.dayOfWeek === dayOfWeek);
    if (dayIndex === -1) {
      throw new RoutineDomainError(
        RoutineErrorCode.EXERCISE_DAY_NOT_FOUND,
        `Day "${dayOfWeek}" not found in routine`,
        { dayOfWeek },
      );
    }

    const updatedDay = this.days[dayIndex].addExercise(exercise);
    const updatedDays = [...this.days];
    updatedDays[dayIndex] = updatedDay;

    return new Routine(
      this.id,
      this.name,
      this.userId,
      updatedDays,
      this.createdAt,
      new Date(),
    );
  }

  /**
   * Removes an exercise from a specific day of the routine.
   * Enforces: day must exist, exercise must exist in day (RF-10.0.6).
   * Returns a new Routine with the exercise removed.
   */
  public removeExerciseFromDay(dayOfWeek: string, exerciseId: string): Routine {
    const dayIndex = this.days.findIndex((d) => d.dayOfWeek === dayOfWeek);
    if (dayIndex === -1) {
      throw new RoutineDomainError(
        RoutineErrorCode.EXERCISE_DAY_NOT_FOUND,
        `Day "${dayOfWeek}" not found in routine`,
        { dayOfWeek },
      );
    }

    const updatedDay = this.days[dayIndex].removeExercise(exerciseId);
    const updatedDays = [...this.days];
    updatedDays[dayIndex] = updatedDay;

    return new Routine(
      this.id,
      this.name,
      this.userId,
      updatedDays,
      this.createdAt,
      new Date(),
    );
  }
}
