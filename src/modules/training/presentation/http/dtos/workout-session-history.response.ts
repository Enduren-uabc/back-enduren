import { WorkoutSessionSummaryResponseDto } from './workout-session-summary.response';

export class WorkoutSessionHistoryResponseDto {
  sessions!: WorkoutSessionSummaryResponseDto[];
  hasIncompleteData!: boolean;
}
