import { Inject, Injectable } from '@nestjs/common';
import {
  TRAINER_LINK_REQUEST_REPOSITORY_PORT,
  TrainerLinkRequestRepositoryPort,
} from '../../../domain/repositories/trainer-link-request.repository.port';
import {
  TrainerLinkDomainError,
  TrainerLinkErrorCode,
} from '../../../domain/errors/trainer-link.domain-error';

export interface CancelLinkRequestInput {
  actorId: string;
  requestId: string;
}

export interface CancelLinkRequestOutput {
  id: string;
  status: string;
  cancelledAt: Date;
}

@Injectable()
export class CancelLinkRequestUseCase {
  constructor(
    @Inject(TRAINER_LINK_REQUEST_REPOSITORY_PORT)
    private readonly linkRequestRepository: TrainerLinkRequestRepositoryPort,
  ) {}

  async execute(
    input: CancelLinkRequestInput,
  ): Promise<CancelLinkRequestOutput> {
    const request = await this.linkRequestRepository.findById(input.requestId);
    if (!request) {
      throw new TrainerLinkDomainError(
        TrainerLinkErrorCode.LINK_REQUEST_NOT_FOUND,
        'Link request not found',
      );
    }

    if (request.clientId !== input.actorId) {
      throw new TrainerLinkDomainError(
        TrainerLinkErrorCode.UNAUTHORIZED_LINK_ACCESS,
        'Only the client who sent the request can cancel it',
      );
    }

    const cancelled = request.cancel();
    const saved = await this.linkRequestRepository.save(cancelled);

    return {
      id: saved.id,
      status: saved.status,
      cancelledAt: saved.cancelledAt!,
    };
  }
}
