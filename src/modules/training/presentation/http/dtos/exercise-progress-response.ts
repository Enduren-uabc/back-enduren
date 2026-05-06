export class ExerciseProgressRecordDto {
  sessionId!: string;
  date!: string;
  weightUsed!: number;
  repsPerformed!: number;
  setsCompleted!: number;
  totalSets!: number;
}

export class ExerciseProgressResponseDto {
  sufficientData!: boolean;
  exerciseId!: string;
  exerciseName!: string;
  records!: ExerciseProgressRecordDto[];
  message!: string | null;
}
