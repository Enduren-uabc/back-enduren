import { Inject, Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import {
  TRAINER_LINK_REQUEST_REPOSITORY_PORT,
  TrainerLinkRequestRepositoryPort,
} from '../../../domain/repositories/trainer-link-request.repository.port';
import {
  TRAINER_LINK_REPOSITORY_PORT,
  TrainerLinkRepositoryPort,
} from '../../../domain/repositories/trainer-link.repository.port';
import {
  TrainerLinkDomainError,
  TrainerLinkErrorCode,
} from '../../../domain/errors/trainer-link.domain-error';
import { TrainerLink } from '../../../domain/entities/trainer-link.entity';
import { LinkConfigPort, LINK_CONFIG_PORT } from '../../ports/link-config.port';
import {
  NOTIFICATION_REPOSITORY_PORT,
  NotificationRepository,
} from '../../../../training-reminders/domain/repositories/notification.repository.port';
import { InAppNotification } from '../../../../training-reminders/domain/entities/notification.entity';

export interface AcceptLinkRequestInput {
  actorId: string;
  requestId: string;
}

export interface AcceptLinkRequestOutput {
  requestId: string;
  linkId: string;
  status: string;
  activatedAt: Date;
}

@Injectable()
export class AcceptLinkRequestUseCase {
  constructor(
    @Inject(TRAINER_LINK_REQUEST_REPOSITORY_PORT)
    private readonly linkRequestRepository: TrainerLinkRequestRepositoryPort,
    @Inject(TRAINER_LINK_REPOSITORY_PORT)
    private readonly linkRepository: TrainerLinkRepositoryPort,
    @Inject(LINK_CONFIG_PORT)
    private readonly linkConfig: LinkConfigPort,
    @Inject(NOTIFICATION_REPOSITORY_PORT)
    private readonly notificationRepository: NotificationRepository,
    private readonly dataSource: DataSource,
  ) {}

  async execute(
    input: AcceptLinkRequestInput,
  ): Promise<AcceptLinkRequestOutput> {
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
        'Only the trainer who received the request can accept it',
      );
    }

    const activeClientsCount = await this.linkRepository.countActiveByTrainerId(
      input.actorId,
    );
    if (activeClientsCount >= this.linkConfig.maxActiveClientsPerTrainer) {
      throw new TrainerLinkDomainError(
        TrainerLinkErrorCode.TRAINER_ACTIVE_CLIENT_LIMIT,
        `You already have ${activeClientsCount} active client link(s). Maximum allowed: ${this.linkConfig.maxActiveClientsPerTrainer}`,
      );
    }

    const result = await this.dataSource.transaction(async () => {
      const accepted = request.accept(input.actorId);
      const savedRequest = await this.linkRequestRepository.save(accepted);

      const link = TrainerLink.create({
        id: crypto.randomUUID(),
        clientId: request.clientId,
        trainerId: request.trainerId,
        linkRequestId: request.id,
      });
      const savedLink = await this.linkRepository.save(link);

      const notification = InAppNotification.create(
        request.clientId,
        'Solicitud aceptada',
        `Tu solicitud de vinculación fue aceptada por el entrenador.`,
      );
      await this.notificationRepository.save(notification);

      return {
        requestId: savedRequest.id,
        linkId: savedLink.id,
        status: savedRequest.status,
        activatedAt: savedLink.activatedAt,
      };
    });

    return result;
  }
}
