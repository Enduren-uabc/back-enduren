export class ExerciseSetResponseDto {
  id!: string;
  setNumber!: number;
  reps!: number;
  weight!: number;
  restSeconds!: number | null;
}

export class ExerciseResponseDto {
  id!: string;
  name!: string;
  order!: number;
  sets!: ExerciseSetResponseDto[];
}

export class RoutineDayResponseDto {
  dayOfWeek!: string;
  exercises!: ExerciseResponseDto[];
}

export class RoutineResponseDto {
  id!: string;
  name!: string;
  userId!: string;
  isActive!: boolean;
  trainingStrategyKey!: string | null;
  dayOfWeeks!: string[];
  days!: RoutineDayResponseDto[];
  createdAt!: Date;
  updatedAt!: Date;
}
