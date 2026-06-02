import { Injectable, Inject } from '@nestjs/common';
import {
  ProfileRepository,
  PROFILE_REPOSITORY_PORT,
} from '../../../domain/repositories/profile.repository';
import {
  ProfileDomainError,
  ProfileErrorCode,
} from '../../../domain/errors/profile-domain.error';

export interface GetProfileOutput {
  id: string;
  userId: string;
  fullName: string;
  birthDate: Date;
  gender: string;
  weight: number;
  height: number;
  experienceLevel: string;
  mainGoal: string;
  daysAvailablePerWeek: number;
  weightUnit: string;
  defaultTrainingStrategyKey: string | null;
  onboardingCompleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class GetProfileUseCase {
  constructor(
    @Inject(PROFILE_REPOSITORY_PORT)
    private readonly profileRepository: ProfileRepository,
  ) {}

  async execute(userId: string): Promise<GetProfileOutput | null> {
    const profile = await this.profileRepository.findByUserId(userId);

    if (!profile) {
      return null;
    }

    return {
      id: profile.id,
      userId: profile.userId,
      fullName: profile.fullName,
      birthDate: profile.birthDate,
      gender: profile.gender,
      weight: profile.weight,
      height: profile.height,
      experienceLevel: profile.experienceLevel,
      mainGoal: profile.mainGoal,
      daysAvailablePerWeek: profile.daysAvailablePerWeek,
      weightUnit: profile.weightUnit,
      defaultTrainingStrategyKey: profile.defaultTrainingStrategyKey,
      onboardingCompleted: profile.onboardingCompleted,
      createdAt: profile.createdAt,
      updatedAt: profile.updatedAt,
    };
  }
}
