export class PublicTrainerProfileResponseDto {
  userId!: string;
  trainerCode!: string | null;
  displayName!: string;
  specialties!: string[];
  yearsOfExperience!: number;
  shortBio!: string | null;
  profileImageUrl!: string | null;
}
