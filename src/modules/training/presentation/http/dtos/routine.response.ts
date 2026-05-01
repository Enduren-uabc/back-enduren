export class ExerciseResponseDto {
  id!: string;
  name!: string;
  order!: number;
}

export class RoutineDayResponseDto {
  dayOfWeek!: string;
  exercises!: ExerciseResponseDto[];
}

export class RoutineResponseDto {
  id!: string;
  name!: string;
  userId!: string;
  days!: RoutineDayResponseDto[];
  createdAt!: Date;
  updatedAt!: Date;
}
