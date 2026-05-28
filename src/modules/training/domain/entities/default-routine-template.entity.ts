import {
  RoutineDomainError,
  RoutineErrorCode,
} from '../errors/routine-domain.error';

export class DefaultRoutineTemplateExercise {
  public readonly id: string;
  public readonly exerciseCatalogId: string;
  public readonly exerciseName: string;
  public readonly exerciseOrder: number;
  public readonly setsCount: number;
  public readonly initialReps: number;
  public readonly initialWeight: number;

  private constructor(
    id: string,
    exerciseCatalogId: string,
    exerciseName: string,
    exerciseOrder: number,
    setsCount: number,
    initialReps: number,
    initialWeight: number,
  ) {
    this.id = id;
    this.exerciseCatalogId = exerciseCatalogId;
    this.exerciseName = exerciseName;
    this.exerciseOrder = exerciseOrder;
    this.setsCount = setsCount;
    this.initialReps = initialReps;
    this.initialWeight = initialWeight;
  }

  public static create(
    id: string,
    exerciseCatalogId: string,
    exerciseName: string,
    exerciseOrder: number,
    setsCount: number,
    initialReps: number,
    initialWeight: number,
  ): DefaultRoutineTemplateExercise {
    if (!exerciseName || exerciseName.trim().length === 0) {
      throw new RoutineDomainError(
        RoutineErrorCode.EXERCISE_NAME_REQUIRED,
        'Exercise name is required',
        { name: exerciseName },
      );
    }
    return new DefaultRoutineTemplateExercise(
      id,
      exerciseCatalogId,
      exerciseName.trim(),
      exerciseOrder,
      setsCount,
      initialReps,
      initialWeight,
    );
  }
}

export class DefaultRoutineTemplate {
  public readonly id: string;
  public readonly experienceLevel: string;
  public readonly splitKey: string | null;
  public readonly name: string;
  public readonly dayOfWeek: string;
  public readonly displayOrder: number;
  public readonly exercises: DefaultRoutineTemplateExercise[];

  private constructor(
    id: string,
    experienceLevel: string,
    splitKey: string | null,
    name: string,
    dayOfWeek: string,
    displayOrder: number,
    exercises: DefaultRoutineTemplateExercise[],
  ) {
    this.id = id;
    this.experienceLevel = experienceLevel;
    this.splitKey = splitKey;
    this.name = name;
    this.dayOfWeek = dayOfWeek;
    this.displayOrder = displayOrder;
    this.exercises = exercises;
  }

  public static create(
    id: string,
    experienceLevel: string,
    splitKey: string | null,
    name: string,
    dayOfWeek: string,
    displayOrder: number,
    exercises: DefaultRoutineTemplateExercise[],
  ): DefaultRoutineTemplate {
    return new DefaultRoutineTemplate(
      id,
      experienceLevel,
      splitKey,
      name,
      dayOfWeek,
      displayOrder,
      exercises,
    );
  }
}
