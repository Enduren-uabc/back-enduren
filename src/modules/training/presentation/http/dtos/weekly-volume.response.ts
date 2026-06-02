export class WeeklyVolumeEntryDto {
  weekStart!: string;
  weekLabel!: string;
  totalVolume!: number;
  workoutCount!: number;
}

export class WeeklyVolumeResponseDto {
  entries!: WeeklyVolumeEntryDto[];
}
