import { Inject, Injectable } from '@nestjs/common';
import { CurrentActor } from '../../ports/current-actor.port';
import {
  TrainerVerificationRepository,
  TRAINER_VERIFICATION_REPOSITORY_PORT,
} from '../../../domain/repositories/trainer-verification.repository.port';
import {
  TRAINER_FLOW_CONFIG_PORT,
  TrainerFlowConfigPort,
} from '../../ports/trainer-flow-config.port';
import { assertAdmin } from '../trainer-verification-use-case.helpers';

export interface ListPendingVerificationsInput {
  actor: CurrentActor;
  page?: number;
  limit?: number;
}

export interface ListPendingVerificationsOutput {
  verifications: {
    id: string;
    userId: string;
    username: string;
    fullName: string;
    submittedAt: Date;
    specialties: string[];
    advancedStatus?: string;
    riskLevel?: string;
    riskScore?: number;
  }[];
  total: number;
}

@Injectable()
export class ListPendingVerificationsUseCase {
  constructor(
    @Inject(TRAINER_VERIFICATION_REPOSITORY_PORT)
    private readonly verificationRepository: TrainerVerificationRepository,
    @Inject(TRAINER_FLOW_CONFIG_PORT)
    private readonly flowConfig: TrainerFlowConfigPort,
  ) {}

  async execute(
    input: ListPendingVerificationsInput,
  ): Promise<ListPendingVerificationsOutput> {
    assertAdmin(input.actor);

    const page = Math.max(1, input.page ?? 1);
    const limit = Math.min(100, Math.max(1, input.limit ?? 20));

    const isPowerspike = this.flowConfig.isPowerspikeEnabled();

    if (isPowerspike) {
      return this.verificationRepository.listPendingAdvanced(page, limit);
    }

    return this.verificationRepository.listPending(page, limit);
  }
}
