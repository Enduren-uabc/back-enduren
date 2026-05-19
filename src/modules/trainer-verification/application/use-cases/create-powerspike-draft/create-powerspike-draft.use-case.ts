import { Inject, Injectable } from '@nestjs/common';
import { CurrentActor } from '../../ports/current-actor.port';
import {
  TRAINER_FLOW_CONFIG_PORT,
  TrainerFlowConfigPort,
} from '../../ports/trainer-flow-config.port';
import { TrainerVerification } from '../../../domain/entities/trainer-verification.entity';
import {
  TRAINER_VERIFICATION_AUDIT_REPOSITORY_PORT,
  TrainerVerificationAuditRepository,
} from '../../../domain/repositories/trainer-verification-audit.repository.port';
import {
  TRAINER_VERIFICATION_REPOSITORY_PORT,
  TrainerVerificationRepository,
} from '../../../domain/repositories/trainer-verification.repository.port';
import {
  TrainerVerificationDomainError,
  TrainerVerificationErrorCode,
} from '../../../domain/errors/trainer-verification.domain-error';
import {
  TrainerVerificationStateMachineService,
  TransitionActor,
} from '../../services/trainer-verification-state-machine.service';
import { assertTrainer } from '../trainer-verification-use-case.helpers';

export interface CreatePowerspikeDraftInput {
  actor: CurrentActor;
  specialtyKeys?: string[];
  yearsOfExperience?: number;
  shortBio?: string;
}

export interface CreatePowerspikeDraftOutput {
  verificationId: string;
  advancedStatus: 'draft';
}

@Injectable()
export class CreatePowerspikeDraftUseCase {
  constructor(
    @Inject(TRAINER_VERIFICATION_REPOSITORY_PORT)
    private readonly verificationRepository: TrainerVerificationRepository,
    @Inject(TRAINER_VERIFICATION_AUDIT_REPOSITORY_PORT)
    private readonly auditRepository: TrainerVerificationAuditRepository,
    private readonly stateMachine: TrainerVerificationStateMachineService,
    @Inject(TRAINER_FLOW_CONFIG_PORT)
    private readonly flowConfig: TrainerFlowConfigPort,
  ) {}

  async execute(
    input: CreatePowerspikeDraftInput,
  ): Promise<CreatePowerspikeDraftOutput> {
    assertTrainer(input.actor);

    if (!this.flowConfig.isPowerspikeEnabled()) {
      throw new TrainerVerificationDomainError(
        TrainerVerificationErrorCode.INVALID_DRAFT_OPERATION,
        'Powerspike flow is not enabled',
      );
    }

    const existing = await this.verificationRepository.findByUserId(
      input.actor.userId,
    );

    if (existing) {
      if (existing.advancedStatus === 'draft') {
        return {
          verificationId: existing.id,
          advancedStatus: 'draft',
        };
      }
      throw new TrainerVerificationDomainError(
        TrainerVerificationErrorCode.INVALID_DRAFT_OPERATION,
        'A trainer verification already exists in a non-draft state',
      );
    }

    const verification = TrainerVerification.createDraft(
      crypto.randomUUID(),
      input.actor.userId,
      {
        specialtyKeys: input.specialtyKeys,
        yearsOfExperience: input.yearsOfExperience,
        shortBio: input.shortBio,
      },
    );

    const transitionActor: TransitionActor = {
      actorId: input.actor.userId,
      actorType: 'user',
    };

    const change = this.stateMachine.transition(
      verification,
      'draft',
      transitionActor,
      'Powerspike draft created',
    );

    await this.verificationRepository.save(verification);
    await this.auditRepository.recordStatusChange(change);

    return {
      verificationId: verification.id,
      advancedStatus: 'draft',
    };
  }
}
