import { Inject, Injectable } from '@nestjs/common';
import { CurrentActor } from '../../ports/current-actor.port';
import {
  TrainerVerificationRepository,
  TRAINER_VERIFICATION_REPOSITORY_PORT,
} from '../../../domain/repositories/trainer-verification.repository.port';
import { assertTrainer } from '../trainer-verification-use-case.helpers';

export interface GetMyVerificationStatusInput {
  actor: CurrentActor;
}

export interface GetMyVerificationStatusOutput {
  verificationId: string | null;
  status: 'none' | 'pending' | 'approved' | 'rejected';
  rejectionReason?: string;
  specialties?: string[];
  yearsOfExperience?: number;
  shortBio?: string;
}

@Injectable()
export class GetMyVerificationStatusUseCase {
  constructor(
    @Inject(TRAINER_VERIFICATION_REPOSITORY_PORT)
    private readonly verificationRepository: TrainerVerificationRepository,
  ) {}

  async execute(
    input: GetMyVerificationStatusInput,
  ): Promise<GetMyVerificationStatusOutput> {
    assertTrainer(input.actor);

    const verification = await this.verificationRepository.findByUserId(
      input.actor.userId,
    );
    if (!verification) {
      return {
        verificationId: null,
        status: 'none',
      };
    }

    return {
      verificationId: verification.id,
      status: verification.verificationStatus,
      rejectionReason: verification.rejectionReason ?? undefined,
      specialties: verification.specialtyKeys,
      yearsOfExperience: verification.yearsOfExperience,
      shortBio: verification.shortBio,
    };
  }
}
