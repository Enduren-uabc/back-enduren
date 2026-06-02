import { Inject, Injectable } from '@nestjs/common';
import {
  USER_REPOSITORY_PORT,
  UserRepository,
} from '../../../../users/domain/repositories/user.repository';
import { SOCIAL_PROFILE_REPOSITORY_PORT } from '../../../../profile/application/use-cases/follow-profile/follow-profile.use-case';
import type { SocialProfileRepository } from '../../../../profile/domain/repositories/social-profile.repository';
import {
  TRAINER_VERIFICATION_REPOSITORY_PORT,
  TrainerVerificationRepository,
} from '../../../../trainer-verification/domain/repositories/trainer-verification.repository.port';
import {
  SPECIALTY_CATALOG_REPOSITORY_PORT,
  SpecialtyCatalogRepository,
} from '../../../../trainer-verification/domain/repositories/specialty-catalog.repository.port';
import {
  TrainerLinkDomainError,
  TrainerLinkErrorCode,
} from '../../../domain/errors/trainer-link.domain-error';

export interface GetPublicTrainerProfileInput {
  trainerId: string;
}

export interface GetPublicTrainerProfileOutput {
  userId: string;
  trainerCode: string | null;
  displayName: string;
  specialties: string[];
  yearsOfExperience: number;
  shortBio: string | null;
  profileImageUrl: string | null;
}

@Injectable()
export class GetPublicTrainerProfileUseCase {
  constructor(
    @Inject(USER_REPOSITORY_PORT)
    private readonly userRepository: UserRepository,
    @Inject(SOCIAL_PROFILE_REPOSITORY_PORT)
    private readonly socialProfileRepository: SocialProfileRepository,
    @Inject(TRAINER_VERIFICATION_REPOSITORY_PORT)
    private readonly verificationRepository: TrainerVerificationRepository,
    @Inject(SPECIALTY_CATALOG_REPOSITORY_PORT)
    private readonly specialtyCatalogRepository: SpecialtyCatalogRepository,
  ) {}

  async execute(
    input: GetPublicTrainerProfileInput,
  ): Promise<GetPublicTrainerProfileOutput> {
    const user = await this.userRepository.findById(input.trainerId);
    if (!user) {
      throw new TrainerLinkDomainError(
        TrainerLinkErrorCode.TRAINER_NOT_FOUND,
        'Trainer not found',
      );
    }

    if (user.role !== 'trainer') {
      throw new TrainerLinkDomainError(
        TrainerLinkErrorCode.TRAINER_NOT_VERIFIED,
        'User is not a trainer',
      );
    }

    const [socialProfile, verification] = await Promise.all([
      this.socialProfileRepository.findByUserId(input.trainerId),
      this.verificationRepository
        .findByUserId(input.trainerId)
        .catch(() => null),
    ]);

    const specialtyKeys = verification?.specialtyKeys ?? [];
    const catalogEntries =
      specialtyKeys.length > 0
        ? await this.specialtyCatalogRepository
            .findByKeys(specialtyKeys)
            .catch(() => [])
        : [];
    const specialties = catalogEntries.map((s) => s.displayName);

    return {
      userId: user.id,
      trainerCode: user.trainerCode,
      displayName: socialProfile?.displayName ?? user.username,
      specialties,
      yearsOfExperience: verification?.yearsOfExperience ?? 0,
      shortBio: socialProfile?.bio ?? null,
      profileImageUrl: socialProfile?.avatarUrl?.value ?? user.avatarUrl,
    };
  }
}
