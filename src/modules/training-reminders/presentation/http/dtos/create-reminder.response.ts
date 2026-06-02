export class CreateReminderResponseDto {
  id!: string;
  routineName!: string;
  dayOfWeek!: string;
  time!: string;
  status!: string;
  nextActivationAt!: string | null;
}
