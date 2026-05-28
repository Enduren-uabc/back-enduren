export class WorkoutSessionSummaryResponseDto {
  id!: string;
  routineId!: string;
  sourceType!: string;
  assignedRoutineId!: string | null;
  dayOfWeek!: string;
  routineName!: string;
  startedAt!: Date;
  finishedAt!: Date | null;
  durationMinutes!: number | null;
  exerciseCount!: number;
  status!: string;
}
