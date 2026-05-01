export class WorkoutSetResponseDto {
  setNumber!: number;
  repsPerformed!: number | null;
  weightUsed!: number | null;
  completed!: boolean;
}

export class WorkoutExerciseResponseDto {
  exerciseId!: string;
  exerciseName!: string;
  order!: number;
  sets!: number;
  repsPerSet!: number;
  weight!: number;
  workoutSets!: WorkoutSetResponseDto[];
}

export class WorkoutSessionResponseDto {
  id!: string;
  userId!: string;
  routineId!: string;
  status!: string;
  currentExerciseIndex!: number;
  exercises!: WorkoutExerciseResponseDto[];
  startedAt!: Date;
  finishedAt!: Date | null;
}
