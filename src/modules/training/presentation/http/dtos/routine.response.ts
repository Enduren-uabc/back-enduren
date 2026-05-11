export class ExerciseResponseDto {
  id!: string;
  name!: string;
  order!: number;
  sets!: number | null;
  repsPerSet!: number | null;
  weight!: number | null;
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
  dayOfWeeks!: string[];
  days!: RoutineDayResponseDto[];
  createdAt!: Date;
  updatedAt!: Date;
}
