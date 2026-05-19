import { Injectable, Inject } from '@nestjs/common';
import {
  ProfileRepository,
  PROFILE_REPOSITORY_PORT,
} from '../../../domain/repositories/profile.repository';

export interface CheckOnboardingStatusOutput {
  completed: boolean;
}

@Injectable()
export class CheckOnboardingStatusUseCase {
  constructor(
    @Inject(PROFILE_REPOSITORY_PORT)
    private readonly profileRepository: ProfileRepository,
  ) {}

  async execute(userId: string): Promise<CheckOnboardingStatusOutput> {
    const profile = await this.profileRepository.findByUserId(userId);

    if (!profile) {
      return { completed: false };
    }

    return { completed: profile.onboardingCompleted };
  }
}
