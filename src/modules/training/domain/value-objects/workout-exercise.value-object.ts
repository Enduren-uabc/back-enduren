import { WorkoutSet } from './workout-set.value-object';
import {
  WorkoutSessionDomainError,
  WorkoutSessionErrorCode,
} from '../errors/workout-session-domain.error';

/**
 * WorkoutExercise value object.
 * Represents an exercise loaded from the routine configuration at session start time.
 * This is a snapshot — it is NOT the same as the Routine's Exercise entity.
 * Contains: exerciseId, exerciseName, order, configuration (sets, repsPerSet, weight),
 * and a list of WorkoutSet entries (initially all pending/empty).
 * Immutable: registerSetRepsAndWeight(), markSetAsCompleted() return new instances.
 */
export class WorkoutExercise {
  public readonly exerciseId: string;
  public readonly exerciseName: string;
  public readonly order: number;
  public readonly sets: number;
  public readonly repsPerSet: number;
  public readonly weight: number;
  public readonly workoutSets: WorkoutSet[];

  private constructor(
    exerciseId: string,
    exerciseName: string,
    order: number,
    sets: number,
    repsPerSet: number,
    weight: number,
    workoutSets: WorkoutSet[],
  ) {
    this.exerciseId = exerciseId;
    this.exerciseName = exerciseName;
    this.order = order;
    this.sets = sets;
    this.repsPerSet = repsPerSet;
    this.weight = weight;
    this.workoutSets = workoutSets;
  }

  /**
   * Creates a WorkoutExercise from routine configuration at session start time.
   * Generates WorkoutSet entries for each set (all pending/empty).
   */
  public static create(
    exerciseId: string,
    exerciseName: string,
    order: number,
    sets: number,
    repsPerSet: number,
    weight: number,
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
    if (!Number.isInteger(sets) || sets < 1 || sets > 10) {
      throw new Error(
        `WorkoutExercise sets must be an integer between 1 and 10, got: ${sets}`,
      );
    }
    if (!Number.isInteger(repsPerSet) || repsPerSet < 1 || repsPerSet > 50) {
      throw new Error(
        `WorkoutExercise repsPerSet must be an integer between 1 and 50, got: ${repsPerSet}`,
      );
    }
    if (typeof weight !== 'number' || weight < 0) {
      throw new Error(
        `WorkoutExercise weight must be a number >= 0, got: ${weight}`,
      );
    }

    const workoutSets: WorkoutSet[] = [];
    for (let i = 1; i <= sets; i++) {
      workoutSets.push(WorkoutSet.create(i));
    }

    return new WorkoutExercise(
      exerciseId,
      exerciseName,
      order,
      sets,
      repsPerSet,
      weight,
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
    sets: number,
    repsPerSet: number,
    weight: number,
    workoutSets: WorkoutSet[],
  ): WorkoutExercise {
    return new WorkoutExercise(
      exerciseId,
      exerciseName,
      order,
      sets,
      repsPerSet,
      weight,
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
      this.sets,
      this.repsPerSet,
      this.weight,
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
      this.sets,
      this.repsPerSet,
      this.weight,
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
      this.sets === other.sets &&
      this.repsPerSet === other.repsPerSet &&
      this.weight === other.weight &&
      this.workoutSets.length === other.workoutSets.length &&
      this.workoutSets.every((s, i) => s.equals(other.workoutSets[i]))
    );
  }
}
