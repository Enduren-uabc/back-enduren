export class WorkoutSessionSummaryResponseDto {
  id!: string;
  routineId!: string;
  dayOfWeek!: string;
  routineName!: string;
  startedAt!: Date;
  finishedAt!: Date | null;
  durationMinutes!: number | null;
  exerciseCount!: number;
  status!: string;
}
