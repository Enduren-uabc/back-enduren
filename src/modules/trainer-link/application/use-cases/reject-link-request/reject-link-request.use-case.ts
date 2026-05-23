import { Inject, Injectable } from '@nestjs/common';
import {
  TRAINER_LINK_REQUEST_REPOSITORY_PORT,
  TrainerLinkRequestRepositoryPort,
} from '../../../domain/repositories/trainer-link-request.repository.port';
import {
  TrainerLinkDomainError,
  TrainerLinkErrorCode,
} from '../../../domain/errors/trainer-link.domain-error';

export interface RejectLinkRequestInput {
  actorId: string;
  requestId: string;
  reason?: string;
}

export interface RejectLinkRequestOutput {
  requestId: string;
  status: string;
  rejectionReason: string | null;
  respondedAt: Date;
}

@Injectable()
export class RejectLinkRequestUseCase {
  constructor(
    @Inject(TRAINER_LINK_REQUEST_REPOSITORY_PORT)
    private readonly linkRequestRepository: TrainerLinkRequestRepositoryPort,
  ) {}

  async execute(
    input: RejectLinkRequestInput,
  ): Promise<RejectLinkRequestOutput> {
    const request = await this.linkRequestRepository.findById(input.requestId);
    if (!request) {
      throw new TrainerLinkDomainError(
        TrainerLinkErrorCode.LINK_REQUEST_NOT_FOUND,
        'Link request not found',
      );
    }

    if (request.trainerId !== input.actorId) {
      throw new TrainerLinkDomainError(
        TrainerLinkErrorCode.UNAUTHORIZED_LINK_ACCESS,
        'Only the trainer who received the request can reject it',
      );
    }

    const rejected = request.reject(input.actorId, input.reason);
    const saved = await this.linkRequestRepository.save(rejected);

    return {
      requestId: saved.id,
      status: saved.status,
      rejectionReason: saved.rejectionReason,
      respondedAt: saved.respondedAt!,
    };
  }
}
