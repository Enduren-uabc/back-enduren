import {
  RoutineDomainError,
  RoutineErrorCode,
} from '../errors/routine-domain.error';
import { RoutineDay } from '../value-objects/routine-day.value-object';
import { RoutineExerciseSet } from '../value-objects/routine-exercise-set.value-object';
import type { RoutineTargetAudience } from '../value-objects/routine-target-audience.value-object';
import { Exercise } from './exercise.entity';

export interface RoutineProps {
  id: string;
  name: string;
  userId: string;
  days: RoutineDay[];
  isActive: boolean;
  trainingStrategyKey: string | null;
  targetAudience: RoutineTargetAudience;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateRoutineParams {
  id: string;
  name: string;
  userId: string;
  days: RoutineDay[];
  isActive?: boolean;
  trainingStrategyKey?: string | null;
  targetAudience?: RoutineTargetAudience;
}

export class Routine {
  public readonly id: string;
  public readonly name: string;
  public readonly userId: string;
  public readonly days: RoutineDay[];
  public readonly isActive: boolean;
  public readonly trainingStrategyKey: string | null;
  public readonly targetAudience: RoutineTargetAudience;
  public readonly createdAt: Date;
  public readonly updatedAt: Date;

  private constructor(props: RoutineProps) {
    this.id = props.id;
    this.name = props.name;
    this.userId = props.userId;
    this.days = props.days;
    this.isActive = props.isActive;
    this.trainingStrategyKey = props.trainingStrategyKey;
    this.targetAudience = props.targetAudience;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  /**
   * Creates a new Routine with core invariants enforced:
   * - Name must be non-empty.
   * - At least one day is required.
   * - isActive defaults to false unless explicitly set.
   */
  public static create(params: CreateRoutineParams): Routine {
    if (!params.name || params.name.trim().length === 0) {
      throw new RoutineDomainError(
        RoutineErrorCode.ROUTINE_NAME_REQUIRED,
        'Routine name is required',
        { name: params.name },
      );
    }

    if (!params.days || params.days.length === 0) {
      throw new RoutineDomainError(
        RoutineErrorCode.ROUTINE_DAYS_MINIMUM,
        'Routine must have at least one day',
        { daysCount: params.days?.length ?? 0 },
      );
    }

    const now = new Date();
    return new Routine({
      id: params.id,
      name: params.name.trim(),
      userId: params.userId,
      days: [...params.days],
      isActive: params.isActive ?? false,
      trainingStrategyKey: params.trainingStrategyKey ?? null,
      targetAudience: params.targetAudience ?? 'self',
      createdAt: now,
      updatedAt: now,
    });
  }

  /**
   * Reconstitutes a Routine from persistence without re-running creation invariants.
   */
  public static reconstitute(props: RoutineProps): Routine {
    return new Routine({
      ...props,
      days: [...props.days],
    });
  }

  /**
   * Renames this routine. Validates the new name is non-empty.
   * Returns a new Routine with the updated name.
   */
  public rename(newName: string): Routine {
    if (!newName || newName.trim().length === 0) {
      throw new RoutineDomainError(
        RoutineErrorCode.ROUTINE_NAME_REQUIRED,
        'Routine name is required',
        { name: newName },
      );
    }

    return new Routine({
      id: this.id,
      name: newName.trim(),
      userId: this.userId,
      days: this.days,
      isActive: this.isActive,
      trainingStrategyKey: this.trainingStrategyKey,
      targetAudience: this.targetAudience,
      createdAt: this.createdAt,
      updatedAt: new Date(),
    });
  }

  /**
   * Activates this routine. Returns a new Routine with isActive: true.
   * No domain invariants to enforce beyond the field change.
   */
  public activate(): Routine {
    return new Routine({
      id: this.id,
      name: this.name,
      userId: this.userId,
      days: this.days,
      isActive: true,
      trainingStrategyKey: this.trainingStrategyKey,
      targetAudience: this.targetAudience,
      createdAt: this.createdAt,
      updatedAt: new Date(),
    });
  }

  /**
   * Deactivates this routine. Returns a new Routine with isActive: false.
   * No domain invariants to enforce beyond the field change.
   */
  public deactivate(): Routine {
    return new Routine({
      id: this.id,
      name: this.name,
      userId: this.userId,
      days: this.days,
      isActive: false,
      trainingStrategyKey: this.trainingStrategyKey,
      targetAudience: this.targetAudience,
      createdAt: this.createdAt,
      updatedAt: new Date(),
    });
  }

  /**
   * Sets or clears the training strategy for this routine.
   * Returns a new Routine with the updated strategy key.
   */
  public setTrainingStrategy(key: string | null): Routine {
    return new Routine({
      id: this.id,
      name: this.name,
      userId: this.userId,
      days: this.days,
      isActive: this.isActive,
      trainingStrategyKey: key,
      targetAudience: this.targetAudience,
      createdAt: this.createdAt,
      updatedAt: new Date(),
    });
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

    return new Routine({
      id: this.id,
      name: this.name,
      userId: this.userId,
      days: updatedDays,
      isActive: this.isActive,
      trainingStrategyKey: this.trainingStrategyKey,
      targetAudience: this.targetAudience,
      createdAt: this.createdAt,
      updatedAt: new Date(),
    });
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

    return new Routine({
      id: this.id,
      name: this.name,
      userId: this.userId,
      days: updatedDays,
      isActive: this.isActive,
      trainingStrategyKey: this.trainingStrategyKey,
      targetAudience: this.targetAudience,
      createdAt: this.createdAt,
      updatedAt: new Date(),
    });
  }

  /**
   * Removes a day from the routine.
   * Enforces: day must exist, cannot remove the last day.
   * Returns a new Routine with the day removed.
   */
  public removeDay(dayOfWeek: string): Routine {
    const dayIndex = this.days.findIndex((d) => d.dayOfWeek === dayOfWeek);
    if (dayIndex === -1) {
      throw new RoutineDomainError(
        RoutineErrorCode.ROUTINE_DAY_NOT_FOUND,
        `Day "${dayOfWeek}" not found in routine`,
        { dayOfWeek },
      );
    }

    if (this.days.length <= 1) {
      throw new RoutineDomainError(
        RoutineErrorCode.ROUTINE_CANNOT_REMOVE_LAST_DAY,
        'Cannot remove the last day from the routine',
        { dayOfWeek },
      );
    }

    const updatedDays = this.days.filter((_, i) => i !== dayIndex);

    return new Routine({
      id: this.id,
      name: this.name,
      userId: this.userId,
      days: updatedDays,
      isActive: this.isActive,
      trainingStrategyKey: this.trainingStrategyKey,
      targetAudience: this.targetAudience,
      createdAt: this.createdAt,
      updatedAt: new Date(),
    });
  }

  /**
   * Configures an exercise within a specific day of the routine.
   * Enforces: day must exist, exercise must exist in day (RF-11.0.5).
   * Returns a new Routine with the configured exercise.
   */
  public configureExercise(
    dayOfWeek: string,
    exerciseId: string,
    sets: RoutineExerciseSet[],
  ): Routine {
    const dayIndex = this.days.findIndex((d) => d.dayOfWeek === dayOfWeek);
    if (dayIndex === -1) {
      throw new RoutineDomainError(
        RoutineErrorCode.EXERCISE_DAY_NOT_FOUND,
        `Day "${dayOfWeek}" not found in routine`,
        { dayOfWeek },
      );
    }

    const updatedDay = this.days[dayIndex].configureExercise(exerciseId, sets);
    const updatedDays = [...this.days];
    updatedDays[dayIndex] = updatedDay;

    return new Routine({
      id: this.id,
      name: this.name,
      userId: this.userId,
      days: updatedDays,
      isActive: this.isActive,
      trainingStrategyKey: this.trainingStrategyKey,
      targetAudience: this.targetAudience,
      createdAt: this.createdAt,
      updatedAt: new Date(),
    });
  }
}
