import { WorkoutSessionStatus } from '../value-objects/workout-session-status.value-object';
import { WorkoutExercise } from '../value-objects/workout-exercise.value-object';
import {
  isValidDayOfWeek,
  type DayOfWeek,
} from '../value-objects/routine-day.value-object';
import {
  WorkoutSessionDomainError,
  WorkoutSessionErrorCode,
} from '../errors/workout-session-domain.error';
import type { WorkoutSessionSourceType } from '../value-objects/workout-session-source.value-object';

export interface WorkoutSessionProps {
  id: string;
  userId: string;
  routineId: string;
  sourceType: WorkoutSessionSourceType;
  assignedRoutineId: string | null;
  dayOfWeek: DayOfWeek;
  status: WorkoutSessionStatus;
  exercises: WorkoutExercise[];
  currentExerciseIndex: number;
  startedAt: Date;
  finishedAt: Date | null;
}

export interface CreateWorkoutSessionParams {
  id: string;
  userId: string;
  routineId: string;
  exercises: WorkoutExercise[];
  dayOfWeek?: DayOfWeek;
  sourceType?: WorkoutSessionSourceType;
  assignedRoutineId?: string | null;
}

/**
 * WorkoutSession domain entity — aggregate root.
 * Represents a workout session started from an active routine.
 * State transitions: IN_PROGRESS → FINISHED.
 * Immutable after finishing.
 * Enforces: requires userId and routineId, starts in IN_PROGRESS state.
 */
export class WorkoutSession {
  public readonly id: string;
  public readonly userId: string;
  public readonly routineId: string;
  public readonly sourceType: WorkoutSessionSourceType;
  public readonly assignedRoutineId: string | null;
  public readonly dayOfWeek: DayOfWeek;
  public readonly status: WorkoutSessionStatus;
  public readonly exercises: WorkoutExercise[];
  public readonly currentExerciseIndex: number;
  public readonly startedAt: Date;
  public readonly finishedAt: Date | null;

  private constructor(props: WorkoutSessionProps) {
    this.id = props.id;
    this.userId = props.userId;
    this.routineId = props.routineId;
    this.sourceType = props.sourceType;
    this.assignedRoutineId = props.assignedRoutineId;
    this.dayOfWeek = props.dayOfWeek;
    this.status = props.status;
    this.exercises = props.exercises;
    this.currentExerciseIndex = props.currentExerciseIndex;
    this.startedAt = props.startedAt;
    this.finishedAt = props.finishedAt;
  }

  /**
   * Creates a new WorkoutSession in IN_PROGRESS state.
   * Enforces: userId and routineId are required.
   * currentExerciseIndex defaults to 0.
   */
  public static create(params: CreateWorkoutSessionParams): WorkoutSession {
    if (!params.userId || params.userId.trim().length === 0) {
      throw new WorkoutSessionDomainError(
        WorkoutSessionErrorCode.SESSION_NO_ACTIVE_ROUTINE,
        'User ID is required to start a workout session',
        { userId: params.userId },
      );
    }

    if (!params.routineId || params.routineId.trim().length === 0) {
      throw new WorkoutSessionDomainError(
        WorkoutSessionErrorCode.SESSION_NO_ACTIVE_ROUTINE,
        'Routine ID is required to start a workout session',
        { routineId: params.routineId },
      );
    }

    const dayOfWeek = params.dayOfWeek ?? 'monday';
    if (!isValidDayOfWeek(dayOfWeek)) {
      throw new WorkoutSessionDomainError(
        WorkoutSessionErrorCode.SESSION_DAY_NOT_FOUND,
        `Invalid workout day: ${dayOfWeek}`,
        { dayOfWeek },
      );
    }

    const sourceType = params.sourceType ?? 'personal';
    const assignedRoutineId = params.assignedRoutineId ?? null;

    if (sourceType === 'trainer_assigned' && !assignedRoutineId) {
      throw new WorkoutSessionDomainError(
        WorkoutSessionErrorCode.SESSION_NO_ACTIVE_ROUTINE,
        'Assigned routine ID is required for trainer-assigned sessions',
        { sourceType, assignedRoutineId },
      );
    }

    const now = new Date();
    return new WorkoutSession({
      id: params.id,
      userId: params.userId,
      routineId: params.routineId,
      sourceType,
      assignedRoutineId,
      dayOfWeek,
      status: WorkoutSessionStatus.IN_PROGRESS,
      exercises: [...params.exercises],
      currentExerciseIndex: 0,
      startedAt: now,
      finishedAt: null,
    });
  }

  /**
   * Reconstitutes a WorkoutSession from persistence without re-running creation invariants.
   */
  public static reconstitute(props: WorkoutSessionProps): WorkoutSession {
    return new WorkoutSession({
      ...props,
      exercises: [...props.exercises],
    });
  }

  /**
   * Transitions session from IN_PROGRESS to FINISHED.
   * Records finishedAt timestamp.
   * Throws if session is already finished or not in progress.
   */
  public finish(): WorkoutSession {
    if (this.status === WorkoutSessionStatus.FINISHED) {
      throw new WorkoutSessionDomainError(
        WorkoutSessionErrorCode.SESSION_ALREADY_FINISHED,
        'Workout session is already finished',
        { sessionId: this.id },
      );
    }

    return new WorkoutSession({
      id: this.id,
      userId: this.userId,
      routineId: this.routineId,
      sourceType: this.sourceType,
      assignedRoutineId: this.assignedRoutineId,
      dayOfWeek: this.dayOfWeek,
      status: WorkoutSessionStatus.FINISHED,
      exercises: [...this.exercises],
      currentExerciseIndex: this.currentExerciseIndex,
      startedAt: this.startedAt,
      finishedAt: new Date(),
    });
  }

  /**
   * Transitions session from IN_PROGRESS to DISCARDED.
   * Records finishedAt timestamp.
   * Throws if session is already finished, discarded, or not in progress.
   */
  public discard(): WorkoutSession {
    if (this.status === WorkoutSessionStatus.FINISHED) {
      throw new WorkoutSessionDomainError(
        WorkoutSessionErrorCode.SESSION_ALREADY_FINISHED,
        'Cannot discard a finished workout session',
        { sessionId: this.id },
      );
    }

    if (this.status === WorkoutSessionStatus.DISCARDED) {
      throw new WorkoutSessionDomainError(
        WorkoutSessionErrorCode.SESSION_ALREADY_FINISHED,
        'Workout session is already discarded',
        { sessionId: this.id },
      );
    }

    return new WorkoutSession({
      id: this.id,
      userId: this.userId,
      routineId: this.routineId,
      sourceType: this.sourceType,
      assignedRoutineId: this.assignedRoutineId,
      dayOfWeek: this.dayOfWeek,
      status: WorkoutSessionStatus.DISCARDED,
      exercises: [...this.exercises],
      currentExerciseIndex: this.currentExerciseIndex,
      startedAt: this.startedAt,
      finishedAt: new Date(),
    });
  }

  /**
   * Checks whether this session is in progress.
   */
  public isInProgress(): boolean {
    return this.status === WorkoutSessionStatus.IN_PROGRESS;
  }

  /**
   * Checks whether this session is finished.
   */
  public isFinished(): boolean {
    return this.status === WorkoutSessionStatus.FINISHED;
  }

  /**
   * Checks whether this session is discarded.
   */
  public isDiscarded(): boolean {
    return this.status === WorkoutSessionStatus.DISCARDED;
  }

  /**
   * Registers reps and weight for a specific set in a specific exercise.
   * Validates session is IN_PROGRESS, exerciseIndex is valid.
   * Delegates to WorkoutExercise.registerSetRepsAndWeight().
   * Returns a new WorkoutSession with updated exercises.
   */
  public registerSetRepsAndWeight(
    exerciseIndex: number,
    setNumber: number,
    repsPerformed: number,
    weightUsed: number,
  ): WorkoutSession {
    if (this.status === WorkoutSessionStatus.FINISHED) {
      throw new WorkoutSessionDomainError(
        WorkoutSessionErrorCode.SESSION_ALREADY_FINISHED,
        'Cannot register reps and weight for a finished session',
        { sessionId: this.id },
      );
    }

    if (
      !Number.isInteger(exerciseIndex) ||
      exerciseIndex < 0 ||
      exerciseIndex >= this.exercises.length
    ) {
      throw new WorkoutSessionDomainError(
        WorkoutSessionErrorCode.SESSION_EXERCISE_INDEX_INVALID,
        `Exercise index ${exerciseIndex} is invalid for this session`,
        { exerciseIndex, exerciseCount: this.exercises.length },
      );
    }

    const updatedExercise = this.exercises[
      exerciseIndex
    ].registerSetRepsAndWeight(setNumber, repsPerformed, weightUsed);

    const updatedExercises = [...this.exercises];
    updatedExercises[exerciseIndex] = updatedExercise;

    return new WorkoutSession({
      id: this.id,
      userId: this.userId,
      routineId: this.routineId,
      sourceType: this.sourceType,
      assignedRoutineId: this.assignedRoutineId,
      dayOfWeek: this.dayOfWeek,
      status: this.status,
      exercises: updatedExercises,
      currentExerciseIndex: this.currentExerciseIndex,
      startedAt: this.startedAt,
      finishedAt: this.finishedAt,
    });
  }

  /**
   * Marks a specific set as completed in a specific exercise.
   * Validates session is IN_PROGRESS, exerciseIndex is valid.
   * Delegates to WorkoutExercise.markSetAsCompleted().
   * Returns a new WorkoutSession with updated exercises.
   */
  public markSetAsCompleted(
    exerciseIndex: number,
    setNumber: number,
  ): WorkoutSession {
    if (this.status === WorkoutSessionStatus.FINISHED) {
      throw new WorkoutSessionDomainError(
        WorkoutSessionErrorCode.SESSION_ALREADY_FINISHED,
        'Cannot mark a set as completed for a finished session',
        { sessionId: this.id },
      );
    }

    if (
      !Number.isInteger(exerciseIndex) ||
      exerciseIndex < 0 ||
      exerciseIndex >= this.exercises.length
    ) {
      throw new WorkoutSessionDomainError(
        WorkoutSessionErrorCode.SESSION_EXERCISE_INDEX_INVALID,
        `Exercise index ${exerciseIndex} is invalid for this session`,
        { exerciseIndex, exerciseCount: this.exercises.length },
      );
    }

    const updatedExercise =
      this.exercises[exerciseIndex].markSetAsCompleted(setNumber);

    const updatedExercises = [...this.exercises];
    updatedExercises[exerciseIndex] = updatedExercise;

    return new WorkoutSession({
      id: this.id,
      userId: this.userId,
      routineId: this.routineId,
      sourceType: this.sourceType,
      assignedRoutineId: this.assignedRoutineId,
      dayOfWeek: this.dayOfWeek,
      status: this.status,
      exercises: updatedExercises,
      currentExerciseIndex: this.currentExerciseIndex,
      startedAt: this.startedAt,
      finishedAt: this.finishedAt,
    });
  }

  /**
   * Toggles the completion status for a specific set in a specific exercise.
   * If completed, marks it as pending. If pending, marks it as completed.
   * Validates session is IN_PROGRESS, exerciseIndex is valid.
   * Returns a new WorkoutSession with updated exercises.
   */
  public toggleSetCompleted(
    exerciseIndex: number,
    setNumber: number,
  ): WorkoutSession {
    if (this.status === WorkoutSessionStatus.FINISHED) {
      throw new WorkoutSessionDomainError(
        WorkoutSessionErrorCode.SESSION_ALREADY_FINISHED,
        'Cannot toggle a set completion for a finished session',
        { sessionId: this.id },
      );
    }

    if (
      !Number.isInteger(exerciseIndex) ||
      exerciseIndex < 0 ||
      exerciseIndex >= this.exercises.length
    ) {
      throw new WorkoutSessionDomainError(
        WorkoutSessionErrorCode.SESSION_EXERCISE_INDEX_INVALID,
        `Exercise index ${exerciseIndex} is invalid for this session`,
        { exerciseIndex, exerciseCount: this.exercises.length },
      );
    }

    const updatedExercise =
      this.exercises[exerciseIndex].toggleSetCompleted(setNumber);

    const updatedExercises = [...this.exercises];
    updatedExercises[exerciseIndex] = updatedExercise;

    return new WorkoutSession({
      id: this.id,
      userId: this.userId,
      routineId: this.routineId,
      sourceType: this.sourceType,
      assignedRoutineId: this.assignedRoutineId,
      dayOfWeek: this.dayOfWeek,
      status: this.status,
      exercises: updatedExercises,
      currentExerciseIndex: this.currentExerciseIndex,
      startedAt: this.startedAt,
      finishedAt: this.finishedAt,
    });
  }

  /**
   * Adds a new set to a specific exercise in the session.
   * Validates session is IN_PROGRESS, exerciseIndex is valid.
   * Delegates to WorkoutExercise.addSet().
   * Returns a new WorkoutSession with the updated exercises.
   */
  public addSetToExercise(
    exerciseIndex: number,
    reps: number,
    weight: number,
  ): WorkoutSession {
    if (this.status === WorkoutSessionStatus.FINISHED) {
      throw new WorkoutSessionDomainError(
        WorkoutSessionErrorCode.SESSION_ALREADY_FINISHED,
        'Cannot add a set to a finished session',
        { sessionId: this.id },
      );
    }

    if (
      !Number.isInteger(exerciseIndex) ||
      exerciseIndex < 0 ||
      exerciseIndex >= this.exercises.length
    ) {
      throw new WorkoutSessionDomainError(
        WorkoutSessionErrorCode.SESSION_EXERCISE_INDEX_INVALID,
        `Exercise index ${exerciseIndex} is invalid for this session`,
        { exerciseIndex, exerciseCount: this.exercises.length },
      );
    }

    const updatedExercise = this.exercises[exerciseIndex].addSet(reps, weight);
    const updatedExercises = [...this.exercises];
    updatedExercises[exerciseIndex] = updatedExercise;

    return new WorkoutSession({
      id: this.id,
      userId: this.userId,
      routineId: this.routineId,
      sourceType: this.sourceType,
      assignedRoutineId: this.assignedRoutineId,
      dayOfWeek: this.dayOfWeek,
      status: this.status,
      exercises: updatedExercises,
      currentExerciseIndex: this.currentExerciseIndex,
      startedAt: this.startedAt,
      finishedAt: this.finishedAt,
    });
  }

  /**
   * Removes a set from a specific exercise in the session.
   * Validates session is IN_PROGRESS, exerciseIndex is valid.
   * Delegates to WorkoutExercise.removeSet().
   * Returns a new WorkoutSession with the updated exercises.
   */
  public removeSetFromExercise(
    exerciseIndex: number,
    setNumber: number,
  ): WorkoutSession {
    if (this.status === WorkoutSessionStatus.FINISHED) {
      throw new WorkoutSessionDomainError(
        WorkoutSessionErrorCode.SESSION_ALREADY_FINISHED,
        'Cannot remove a set from a finished session',
        { sessionId: this.id },
      );
    }

    if (
      !Number.isInteger(exerciseIndex) ||
      exerciseIndex < 0 ||
      exerciseIndex >= this.exercises.length
    ) {
      throw new WorkoutSessionDomainError(
        WorkoutSessionErrorCode.SESSION_EXERCISE_INDEX_INVALID,
        `Exercise index ${exerciseIndex} is invalid for this session`,
        { exerciseIndex, exerciseCount: this.exercises.length },
      );
    }

    const updatedExercise = this.exercises[exerciseIndex].removeSet(setNumber);
    const updatedExercises = [...this.exercises];
    updatedExercises[exerciseIndex] = updatedExercise;

    return new WorkoutSession({
      id: this.id,
      userId: this.userId,
      routineId: this.routineId,
      sourceType: this.sourceType,
      assignedRoutineId: this.assignedRoutineId,
      dayOfWeek: this.dayOfWeek,
      status: this.status,
      exercises: updatedExercises,
      currentExerciseIndex: this.currentExerciseIndex,
      startedAt: this.startedAt,
      finishedAt: this.finishedAt,
    });
  }

  /**
   * Advances to the next exercise in the session.
   * Validates session is IN_PROGRESS.
   * Validates all sets of the current exercise are completed.
   * Validates not already at the last exercise.
   * Returns a new WorkoutSession with incremented currentExerciseIndex.
   */
  public advanceToNextExercise(allowIncomplete = false): WorkoutSession {
    if (this.status === WorkoutSessionStatus.FINISHED) {
      throw new WorkoutSessionDomainError(
        WorkoutSessionErrorCode.SESSION_ALREADY_FINISHED,
        'Cannot advance exercise for a finished session',
        { sessionId: this.id },
      );
    }

    if (this.exercises.length === 0) {
      throw new WorkoutSessionDomainError(
        WorkoutSessionErrorCode.SESSION_EXERCISE_INDEX_INVALID,
        'Cannot advance exercise in a session with no exercises',
        { exerciseCount: 0 },
      );
    }

    if (this.currentExerciseIndex >= this.exercises.length - 1) {
      throw new WorkoutSessionDomainError(
        WorkoutSessionErrorCode.SESSION_ALREADY_AT_LAST_EXERCISE,
        'Already at the last exercise in this session',
        {
          currentExerciseIndex: this.currentExerciseIndex,
          exerciseCount: this.exercises.length,
        },
      );
    }

    const currentExercise = this.exercises[this.currentExerciseIndex];
    if (!allowIncomplete && !currentExercise.areAllSetsCompleted()) {
      throw new WorkoutSessionDomainError(
        WorkoutSessionErrorCode.SESSION_EXERCISE_SETS_INCOMPLETE,
        'Cannot advance to next exercise: not all sets of the current exercise are completed',
        {
          currentExerciseIndex: this.currentExerciseIndex,
          exerciseId: currentExercise.exerciseId,
        },
      );
    }

    return new WorkoutSession({
      id: this.id,
      userId: this.userId,
      routineId: this.routineId,
      sourceType: this.sourceType,
      assignedRoutineId: this.assignedRoutineId,
      dayOfWeek: this.dayOfWeek,
      status: this.status,
      exercises: [...this.exercises],
      currentExerciseIndex: this.currentExerciseIndex + 1,
      startedAt: this.startedAt,
      finishedAt: this.finishedAt,
    });
  }
}
