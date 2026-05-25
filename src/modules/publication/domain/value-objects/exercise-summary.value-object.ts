export interface ExerciseSummaryItemSet {
  setNumber: number;
  repsPerformed: number | null;
  weightUsed: number | null;
  targetReps: number | null;
  targetWeight: number | null;
  completed: boolean;
}

export interface ExerciseSummaryItem {
  exerciseId: string;
  exerciseName: string;
  completedSets: number;
  totalSets: number;
  volume: number;
  workoutSets: ExerciseSummaryItemSet[];
}

export class ExerciseSummary {
  public readonly totalExercises: number;
  public readonly totalCompletedSets: number;
  public readonly totalSets: number;
  public readonly totalVolume: number;
  public readonly durationMinutes: number;
  public readonly routineName: string;
  public readonly dayOfWeek: string;
  public readonly exercises: ExerciseSummaryItem[];

  private constructor(data: {
    totalExercises: number;
    totalCompletedSets: number;
    totalSets: number;
    totalVolume: number;
    durationMinutes: number;
    routineName: string;
    dayOfWeek: string;
    exercises: ExerciseSummaryItem[];
  }) {
    this.totalExercises = data.totalExercises;
    this.totalCompletedSets = data.totalCompletedSets;
    this.totalSets = data.totalSets;
    this.totalVolume = data.totalVolume;
    this.durationMinutes = data.durationMinutes;
    this.routineName = data.routineName;
    this.dayOfWeek = data.dayOfWeek;
    this.exercises = data.exercises;
  }

  public static create(data: {
    totalExercises: number;
    totalCompletedSets: number;
    totalSets: number;
    totalVolume: number;
    durationMinutes: number;
    routineName: string;
    dayOfWeek: string;
    exercises: ExerciseSummaryItem[];
  }): ExerciseSummary {
    return new ExerciseSummary(data);
  }
}
