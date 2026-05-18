import { Inject, Injectable } from '@nestjs/common';
import { CurrentActor } from '../../ports/current-actor.port';
import {
  UserRepository,
  USER_REPOSITORY_PORT,
} from '../../../../users/domain/repositories/user.repository';
import {
  TrainerVerificationDomainError,
  TrainerVerificationErrorCode,
} from '../../../domain/errors/trainer-verification.domain-error';
import {
  TrainerVerificationRepository,
  TRAINER_VERIFICATION_REPOSITORY_PORT,
} from '../../../domain/repositories/trainer-verification.repository.port';
import { assertAdmin } from '../trainer-verification-use-case.helpers';

export interface ReviewTrainerVerificationInput {
  actor: CurrentActor;
  verificationId: string;
  decision: 'approved' | 'rejected';
  rejectionReason?: string;
}

export interface ReviewTrainerVerificationOutput {
  verificationId: string;
  status: 'approved' | 'rejected';
}

@Injectable()
export class ReviewTrainerVerificationUseCase {
  constructor(
    @Inject(TRAINER_VERIFICATION_REPOSITORY_PORT)
    private readonly verificationRepository: TrainerVerificationRepository,
    @Inject(USER_REPOSITORY_PORT)
    private readonly userRepository: UserRepository,
  ) {}

  async execute(
    input: ReviewTrainerVerificationInput,
  ): Promise<ReviewTrainerVerificationOutput> {
    assertAdmin(input.actor);

    const verification = await this.verificationRepository.findById(
      input.verificationId,
    );
    if (!verification) {
      throw new TrainerVerificationDomainError(
        TrainerVerificationErrorCode.VERIFICATION_NOT_FOUND,
        'Trainer verification was not found',
      );
    }

    const trainer = await this.userRepository.findById(verification.userId);
    if (!trainer) {
      throw new TrainerVerificationDomainError(
        TrainerVerificationErrorCode.NOT_TRAINER_ROLE,
        'User not found for this verification',
      );
    }

    if (input.decision === 'approved') {
      if (trainer.role !== 'trainer') {
        trainer.upgradeToTrainer();
        await this.userRepository.save(trainer);
      }
      verification.approve(input.actor.userId);
    } else {
      verification.reject(input.actor.userId, input.rejectionReason ?? '');
    }

    const saved = await this.verificationRepository.save(verification);
    return {
      verificationId: saved.id,
      status: saved.verificationStatus as 'approved' | 'rejected',
    };
  }
}

