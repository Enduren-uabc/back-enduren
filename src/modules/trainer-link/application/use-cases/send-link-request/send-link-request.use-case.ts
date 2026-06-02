import { Inject, Injectable } from '@nestjs/common';
import {
  TRAINER_LINK_REQUEST_REPOSITORY_PORT,
  TrainerLinkRequestRepositoryPort,
} from '../../../domain/repositories/trainer-link-request.repository.port';
import {
  TRAINER_LINK_REPOSITORY_PORT,
  TrainerLinkRepositoryPort,
} from '../../../domain/repositories/trainer-link.repository.port';
import {
  USER_REPOSITORY_PORT,
  UserRepository,
} from '../../../../users/domain/repositories/user.repository';
import { TrainerLinkRequest } from '../../../domain/entities/trainer-link-request.entity';
import {
  TrainerLinkDomainError,
  TrainerLinkErrorCode,
} from '../../../domain/errors/trainer-link.domain-error';
import { LinkConfigPort, LINK_CONFIG_PORT } from '../../ports/link-config.port';

export interface SendLinkRequestInput {
  actorId: string;
  trainerId: string;
  message?: string;
}

export interface SendLinkRequestOutput {
  id: string;
  clientId: string;
  trainerId: string;
  status: string;
  createdAt: Date;
}

@Injectable()
export class SendLinkRequestUseCase {
  constructor(
    @Inject(TRAINER_LINK_REQUEST_REPOSITORY_PORT)
    private readonly linkRequestRepository: TrainerLinkRequestRepositoryPort,
    @Inject(TRAINER_LINK_REPOSITORY_PORT)
    private readonly linkRepository: TrainerLinkRepositoryPort,
    @Inject(USER_REPOSITORY_PORT)
    private readonly userRepository: UserRepository,
    @Inject(LINK_CONFIG_PORT)
    private readonly linkConfig: LinkConfigPort,
  ) {}

  async execute(input: SendLinkRequestInput): Promise<SendLinkRequestOutput> {
    if (input.actorId === input.trainerId) {
      throw new TrainerLinkDomainError(
        TrainerLinkErrorCode.CANNOT_LINK_TO_SELF,
        'Cannot send a link request to yourself',
      );
    }

    const client = await this.userRepository.findById(input.actorId);
    if (client?.role !== 'user') {
      throw new TrainerLinkDomainError(
        TrainerLinkErrorCode.UNAUTHORIZED_LINK_ACCESS,
        'Only client users can send link requests',
      );
    }

    const trainer = await this.userRepository.findById(input.trainerId);
    if (!trainer) {
      throw new TrainerLinkDomainError(
        TrainerLinkErrorCode.TRAINER_NOT_FOUND,
        'Trainer not found',
      );
    }

    if (trainer.role !== 'trainer') {
      throw new TrainerLinkDomainError(
        TrainerLinkErrorCode.TRAINER_NOT_VERIFIED,
        'User is not a trainer',
      );
    }

    if (!trainer.trainerCode) {
      throw new TrainerLinkDomainError(
        TrainerLinkErrorCode.TRAINER_NOT_VERIFIED,
        'Trainer is not verified',
      );
    }

    const hasPendingRequest =
      await this.linkRequestRepository.hasPendingRequest(
        input.actorId,
        input.trainerId,
      );
    if (hasPendingRequest) {
      throw new TrainerLinkDomainError(
        TrainerLinkErrorCode.PENDING_REQUEST_EXISTS,
        'A pending link request already exists between you and this trainer',
      );
    }

    const existingLink = await this.linkRepository.findByClientAndTrainer(
      input.actorId,
      input.trainerId,
    );
    if (existingLink?.status === 'active') {
      throw new TrainerLinkDomainError(
        TrainerLinkErrorCode.LINK_ALREADY_ACTIVE,
        'You already have an active link with this trainer',
      );
    }

    const activeLinksCount = await this.linkRepository.countActiveByClientId(
      input.actorId,
    );
    if (activeLinksCount >= this.linkConfig.maxActiveTrainersPerClient) {
      throw new TrainerLinkDomainError(
        TrainerLinkErrorCode.CLIENT_ACTIVE_LINK_LIMIT,
        `You already have ${activeLinksCount} active trainer link(s). Maximum allowed: ${this.linkConfig.maxActiveTrainersPerClient}`,
      );
    }

    const linkRequest = TrainerLinkRequest.create({
      id: crypto.randomUUID(),
      clientId: input.actorId,
      trainerId: input.trainerId,
      message: input.message,
    });

    const saved = await this.linkRequestRepository.save(linkRequest);

    return {
      id: saved.id,
      clientId: saved.clientId,
      trainerId: saved.trainerId,
      status: saved.status,
      createdAt: saved.createdAt,
    };
  }
}
