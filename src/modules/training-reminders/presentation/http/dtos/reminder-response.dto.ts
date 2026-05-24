export class ReminderResponseDto {
  id!: string;
  routineId!: string;
  routineName!: string;
  dayOfWeek!: string;
  time!: string;
  status!: string;
  nextActivationAt!: string | null;
  createdAt!: string;
  updatedAt!: string;
}
