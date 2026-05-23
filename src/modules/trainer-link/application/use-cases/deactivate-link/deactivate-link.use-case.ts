import { Inject, Injectable } from '@nestjs/common';
import {
  TRAINER_LINK_REPOSITORY_PORT,
  TrainerLinkRepositoryPort,
} from '../../../domain/repositories/trainer-link.repository.port';
import {
  TrainerLinkDomainError,
  TrainerLinkErrorCode,
} from '../../../domain/errors/trainer-link.domain-error';

export interface DeactivateLinkInput {
  actorId: string;
  linkId: string;
  reason?: string;
}

export interface DeactivateLinkOutput {
  linkId: string;
  status: string;
  deactivatedAt: Date;
}

@Injectable()
export class DeactivateLinkUseCase {
  constructor(
    @Inject(TRAINER_LINK_REPOSITORY_PORT)
    private readonly linkRepository: TrainerLinkRepositoryPort,
  ) {}

  async execute(input: DeactivateLinkInput): Promise<DeactivateLinkOutput> {
    const link = await this.linkRepository.findById(input.linkId);
    if (!link) {
      throw new TrainerLinkDomainError(
        TrainerLinkErrorCode.LINK_NOT_FOUND,
        'Link not found',
      );
    }

    if (link.clientId !== input.actorId && link.trainerId !== input.actorId) {
      throw new TrainerLinkDomainError(
        TrainerLinkErrorCode.UNAUTHORIZED_LINK_ACCESS,
        'You are not part of this link',
      );
    }

    const deactivated = link.deactivate(input.reason);
    const saved = await this.linkRepository.save(deactivated);

    return {
      linkId: saved.id,
      status: saved.status,
      deactivatedAt: saved.deactivatedAt!,
    };
  }
}
