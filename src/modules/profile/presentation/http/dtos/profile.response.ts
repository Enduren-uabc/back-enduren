export class ProfileResponseDto {
  id!: string;
  userId!: string;
  fullName!: string;
  birthDate!: string;
  gender!: string;
  weight!: number;
  height!: number;
  experienceLevel!: string;
  mainGoal!: string;
  daysAvailablePerWeek!: number;
  weightUnit!: string;
  defaultTrainingStrategyKey!: string | null;
  onboardingCompleted!: boolean;
  createdAt!: Date;
  updatedAt!: Date;
}
