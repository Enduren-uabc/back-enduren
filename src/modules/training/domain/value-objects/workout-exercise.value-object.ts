import { WorkoutSet } from './workout-set.value-object';
import {
  WorkoutSessionDomainError,
  WorkoutSessionErrorCode,
} from '../errors/workout-session-domain.error';

export interface WorkoutExerciseTargetSet {
  setNumber: number;
  reps: number;
  weight: number;
}

/**
 * WorkoutExercise value object.
 * Represents an exercise loaded from the routine configuration at session start time.
 * This is a snapshot — it is NOT the same as the Routine's Exercise entity.
 * Contains: exerciseId, exerciseName, order, targetSets (from routine),
 * and a list of WorkoutSet entries (initially all pending/empty).
 * Immutable: registerSetRepsAndWeight(), markSetAsCompleted() return new instances.
 */
export class WorkoutExercise {
  public readonly exerciseId: string;
  public readonly exerciseName: string;
  public readonly order: number;
  public readonly targetSets: WorkoutExerciseTargetSet[];
  public readonly workoutSets: WorkoutSet[];

  private constructor(
    exerciseId: string,
    exerciseName: string,
    order: number,
    targetSets: WorkoutExerciseTargetSet[],
    workoutSets: WorkoutSet[],
  ) {
    this.exerciseId = exerciseId;
    this.exerciseName = exerciseName;
    this.order = order;
    this.targetSets = targetSets;
    this.workoutSets = workoutSets;
  }

  /**
   * Creates a WorkoutExercise from routine configuration at session start time.
   * Generates WorkoutSet entries for each target set (all pending/empty).
   */
  public static create(
    exerciseId: string,
    exerciseName: string,
    order: number,
    targetSets: WorkoutExerciseTargetSet[],
  ): WorkoutExercise {
    if (!exerciseId || exerciseId.trim().length === 0) {
      throw new Error('WorkoutExercise exerciseId is required');
    }
    if (!exerciseName || exerciseName.trim().length === 0) {
      throw new Error('WorkoutExercise exerciseName is required');
    }
    if (!Number.isInteger(order) || order < 1) {
      throw new Error(
        `WorkoutExercise order must be a positive integer, got: ${order}`,
      );
    }
    if (!Array.isArray(targetSets) || targetSets.length === 0) {
      throw new Error(
        `WorkoutExercise targetSets must be a non-empty array, got: ${targetSets}`,
      );
    }
    for (const ts of targetSets) {
      if (!Number.isInteger(ts.setNumber) || ts.setNumber < 1) {
        throw new Error(
          `WorkoutExercise targetSet setNumber must be a positive integer, got: ${ts.setNumber}`,
        );
      }
      if (!Number.isInteger(ts.reps) || ts.reps < 1) {
        throw new Error(
          `WorkoutExercise targetSet reps must be a positive integer, got: ${ts.reps}`,
        );
      }
      if (typeof ts.weight !== 'number' || ts.weight < 0) {
        throw new Error(
          `WorkoutExercise targetSet weight must be a number >= 0, got: ${ts.weight}`,
        );
      }
    }

    const workoutSets: WorkoutSet[] = targetSets.map((ts) =>
      WorkoutSet.create(ts.setNumber, ts.reps, ts.weight),
    );

    return new WorkoutExercise(
      exerciseId,
      exerciseName,
      order,
      targetSets,
      workoutSets,
    );
  }

  /**
   * Reconstitutes a WorkoutExercise from persistence without re-running creation invariants.
   */
  public static reconstitute(
    exerciseId: string,
    exerciseName: string,
    order: number,
    targetSets: WorkoutExerciseTargetSet[],
    workoutSets: WorkoutSet[],
  ): WorkoutExercise {
    return new WorkoutExercise(
      exerciseId,
      exerciseName,
      order,
      targetSets,
      workoutSets,
    );
  }

  /**
   * Registers reps and weight for a specific set in this exercise.
   * Delegates to WorkoutSet.registerRepsAndWeight().
   * Returns a new WorkoutExercise with the updated sets array.
   */
  public registerSetRepsAndWeight(
    setNumber: number,
    repsPerformed: number,
    weightUsed: number,
  ): WorkoutExercise {
    const setIndex = this.workoutSets.findIndex(
      (ws) => ws.setNumber === setNumber,
    );
    if (setIndex === -1) {
      throw new WorkoutSessionDomainError(
        WorkoutSessionErrorCode.SESSION_SET_NOT_FOUND,
        `Set number ${setNumber} not found in exercise ${this.exerciseName}`,
        { setNumber, exerciseId: this.exerciseId },
      );
    }

    const updatedSet = this.workoutSets[setIndex].registerRepsAndWeight(
      repsPerformed,
      weightUsed,
    );
    const updatedSets = [...this.workoutSets];
    updatedSets[setIndex] = updatedSet;

    return new WorkoutExercise(
      this.exerciseId,
      this.exerciseName,
      this.order,
      this.targetSets,
      updatedSets,
    );
  }

  /**
   * Marks a specific set as completed in this exercise.
   * Delegates to WorkoutSet.markAsCompleted().
   * Returns a new WorkoutExercise with the updated sets array.
   */
  public markSetAsCompleted(setNumber: number): WorkoutExercise {
    const setIndex = this.workoutSets.findIndex(
      (ws) => ws.setNumber === setNumber,
    );
    if (setIndex === -1) {
      throw new WorkoutSessionDomainError(
        WorkoutSessionErrorCode.SESSION_SET_NOT_FOUND,
        `Set number ${setNumber} not found in exercise ${this.exerciseName}`,
        { setNumber, exerciseId: this.exerciseId },
      );
    }

    const updatedSet = this.workoutSets[setIndex].markAsCompleted();
    const updatedSets = [...this.workoutSets];
    updatedSets[setIndex] = updatedSet;

    return new WorkoutExercise(
      this.exerciseId,
      this.exerciseName,
      this.order,
      this.targetSets,
      updatedSets,
    );
  }

  /**
   * Checks if all sets in this exercise are completed.
   */
  public areAllSetsCompleted(): boolean {
    return this.workoutSets.every((ws) => ws.completed === true);
  }

  public equals(other: WorkoutExercise): boolean {
    return (
      this.exerciseId === other.exerciseId &&
      this.exerciseName === other.exerciseName &&
      this.order === other.order &&
      this.targetSets.length === other.targetSets.length &&
      this.targetSets.every(
        (ts, i) =>
          ts.setNumber === other.targetSets[i].setNumber &&
          ts.reps === other.targetSets[i].reps &&
          ts.weight === other.targetSets[i].weight,
      ) &&
      this.workoutSets.length === other.workoutSets.length &&
      this.workoutSets.every((s, i) => s.equals(other.workoutSets[i]))
    );
  }
}
