import { Injectable, Inject } from '@nestjs/common';
import {
  Profile,
  Gender,
  ExperienceLevel,
  MainGoal,
  WeightUnit,
} from '../../../domain/entities/profile.entity';
import {
  ProfileRepository,
  PROFILE_REPOSITORY_PORT,
} from '../../../domain/repositories/profile.repository';

export interface CreateOrUpdateProfileInput {
  userId: string;
  fullName: string;
  birthDate: Date;
  gender: Gender;
  weight: number;
  height: number;
  experienceLevel: ExperienceLevel;
  mainGoal: MainGoal;
  daysAvailablePerWeek?: number;
  weightUnit?: WeightUnit;
}

export interface CreateOrUpdateProfileOutput {
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
  onboardingCompleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class CreateOrUpdateProfileUseCase {
  constructor(
    @Inject(PROFILE_REPOSITORY_PORT)
    private readonly profileRepository: ProfileRepository,
  ) {}

  async execute(
    input: CreateOrUpdateProfileInput,
  ): Promise<CreateOrUpdateProfileOutput> {
    const existing = await this.profileRepository.findByUserId(input.userId);

    let profile: Profile;

    if (existing) {
      existing.update(
        input.fullName,
        input.birthDate,
        input.gender,
        input.weight,
        input.height,
        input.experienceLevel,
        input.mainGoal,
        input.daysAvailablePerWeek ?? 3,
        input.weightUnit ?? 'kg',
      );
      profile = await this.profileRepository.save(existing);
    } else {
      profile = Profile.create(
        crypto.randomUUID(),
        input.userId,
        input.fullName,
        input.birthDate,
        input.gender,
        input.weight,
        input.height,
        input.experienceLevel,
        input.mainGoal,
        input.daysAvailablePerWeek ?? 3,
        input.weightUnit ?? 'kg',
      );
      profile = await this.profileRepository.save(profile);
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
      onboardingCompleted: profile.onboardingCompleted,
      createdAt: profile.createdAt,
      updatedAt: profile.updatedAt,
    };
  }
}
