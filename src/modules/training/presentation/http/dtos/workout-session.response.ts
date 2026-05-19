export class WorkoutSetResponseDto {
  setNumber!: number;
  repsPerformed!: number | null;
  weightUsed!: number | null;
  targetReps!: number | null;
  targetWeight!: number | null;
  completed!: boolean;
}

export class WorkoutExerciseTargetSetResponseDto {
  setNumber!: number;
  reps!: number;
  weight!: number;
}

export class WorkoutExerciseResponseDto {
  exerciseId!: string;
  exerciseName!: string;
  order!: number;
  targetSets!: WorkoutExerciseTargetSetResponseDto[];
  workoutSets!: WorkoutSetResponseDto[];
}

export class WorkoutSessionResponseDto {
  id!: string;
  userId!: string;
  routineId!: string;
  dayOfWeek!: string;
  status!: string;
  currentExerciseIndex!: number;
  exercises!: WorkoutExerciseResponseDto[];
  startedAt!: Date;
  finishedAt!: Date | null;
}

export class WorkoutSessionDetailResponseDto {
  id!: string;
  userId!: string;
  routineId!: string;
  dayOfWeek!: string;
  routineName!: string;
  status!: string;
  currentExerciseIndex!: number;
  exercises!: WorkoutExerciseResponseDto[];
  startedAt!: Date;
  finishedAt!: Date | null;
  durationMinutes!: number | null;
}
