import { Inject, Injectable } from '@nestjs/common';
import {
  TRAINER_LINK_REPOSITORY_PORT,
  TrainerLinkRepositoryPort,
} from '../../../domain/repositories/trainer-link.repository.port';
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

export type GetMyTrainerOutput = {
  trainerId: string;
  trainerCode: string | null;
  displayName: string;
  specialties: string[];
  yearsOfExperience: number;
  shortBio: string | null;
  profileImageUrl: string | null;
  activatedAt: Date;
  linkId: string;
} | null;

@Injectable()
export class GetMyTrainerUseCase {
  constructor(
    @Inject(TRAINER_LINK_REPOSITORY_PORT)
    private readonly linkRepository: TrainerLinkRepositoryPort,
    @Inject(USER_REPOSITORY_PORT)
    private readonly userRepository: UserRepository,
    @Inject(SOCIAL_PROFILE_REPOSITORY_PORT)
    private readonly socialProfileRepository: SocialProfileRepository,
    @Inject(TRAINER_VERIFICATION_REPOSITORY_PORT)
    private readonly verificationRepository: TrainerVerificationRepository,
    @Inject(SPECIALTY_CATALOG_REPOSITORY_PORT)
    private readonly specialtyCatalogRepository: SpecialtyCatalogRepository,
  ) {}

  async execute(actorId: string): Promise<GetMyTrainerOutput> {
    const activeLinks = await this.linkRepository.findActiveByClientId(actorId);
    if (!activeLinks || activeLinks.length === 0) {
      return null;
    }

    const link = activeLinks[0];

    const trainer = await this.userRepository.findById(link.trainerId);
    if (!trainer) {
      return null;
    }

    const [socialProfile, verification] = await Promise.all([
      this.socialProfileRepository.findByUserId(link.trainerId),
      this.verificationRepository
        .findByUserId(link.trainerId)
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
      trainerId: trainer.id,
      trainerCode: trainer.trainerCode,
      displayName: socialProfile?.displayName ?? trainer.username,
      specialties,
      yearsOfExperience: 0,
      shortBio: socialProfile?.bio ?? null,
      profileImageUrl: socialProfile?.avatarUrl?.value ?? trainer.avatarUrl,
      activatedAt: link.activatedAt,
      linkId: link.id,
    };
  }
}
