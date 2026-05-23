import { Inject, Injectable } from '@nestjs/common';
import {
  USER_REPOSITORY_PORT,
  UserRepository,
} from '../../../../users/domain/repositories/user.repository';
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

    return {
      userId: user.id,
      trainerCode: user.trainerCode,
      displayName: user.username,
      specialties: [],
      yearsOfExperience: 0,
      shortBio: null,
      profileImageUrl: null,
    };
  }
}
