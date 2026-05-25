export class PersonalRecordEntryDto {
  exerciseName!: string;
  exerciseId!: string;
  weight!: number;
  reps!: number;
  date!: string;
  sessionId!: string;
}

export class PersonalRecordsResponseDto {
  records!: PersonalRecordEntryDto[];
  totalCount!: number;
}
