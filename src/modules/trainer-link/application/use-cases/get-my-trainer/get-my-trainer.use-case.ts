import { Inject, Injectable } from '@nestjs/common';
import {
  TRAINER_LINK_REPOSITORY_PORT,
  TrainerLinkRepositoryPort,
} from '../../../domain/repositories/trainer-link.repository.port';
import {
  USER_REPOSITORY_PORT,
  UserRepository,
} from '../../../../users/domain/repositories/user.repository';

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

    return {
      trainerId: trainer.id,
      trainerCode: trainer.trainerCode,
      displayName: trainer.username,
      specialties: [],
      yearsOfExperience: 0,
      shortBio: null,
      profileImageUrl: null,
      activatedAt: link.activatedAt,
      linkId: link.id,
    };
  }
}
