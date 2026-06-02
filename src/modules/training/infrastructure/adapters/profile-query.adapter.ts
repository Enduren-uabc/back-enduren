import { Injectable, Inject } from '@nestjs/common';
import { PROFILE_REPOSITORY_PORT, type ProfileRepository as ProfileDomainRepository } from '../../../profile/domain/repositories/profile.repository';
import { PROFILE_REPOSITORY_PORT as TRAINING_PROFILE_PORT, type ProfileRepository } from '../../application/use-cases/create-routine/create-routine.use-case';

@Injectable()
export class ProfileQueryAdapter implements ProfileRepository {
  constructor(
    @Inject(PROFILE_REPOSITORY_PORT)
    private readonly profileRepository: ProfileDomainRepository,
  ) {}

  async findByUserId(userId: string): Promise<{
    defaultTrainingStrategyKey: string | null;
    experienceLevel: string;
    daysAvailablePerWeek: number;
  } | null> {
    const profile = await this.profileRepository.findByUserId(userId);
    if (!profile) return null;
    return {
      defaultTrainingStrategyKey: profile.defaultTrainingStrategyKey,
      experienceLevel: profile.experienceLevel,
      daysAvailablePerWeek: profile.daysAvailablePerWeek,
    };
  }
}

export { TRAINING_PROFILE_PORT as PROFILE_QUERY_PORT };
