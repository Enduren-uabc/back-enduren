import { Inject, Injectable } from '@nestjs/common';
import {
  TRAINER_LINK_REPOSITORY_PORT,
  TrainerLinkRepositoryPort,
} from '../../../domain/repositories/trainer-link.repository.port';
import { Pagination } from '../../../domain/repositories/trainer-link-request.repository.port';
import {
  USER_REPOSITORY_PORT,
  UserRepository,
} from '../../../../users/domain/repositories/user.repository';

export interface GetActiveLinksInput {
  actorId: string;
  page?: number;
  limit?: number;
}

export interface ActiveLinkWithClientInfo {
  linkId: string;
  clientId: string;
  clientName: string;
  linkStatus: string;
  activatedAt: Date;
}

export interface GetActiveLinksOutput {
  items: ActiveLinkWithClientInfo[];
  total: number;
  page: number;
  limit: number;
}

@Injectable()
export class GetActiveLinksUseCase {
  constructor(
    @Inject(TRAINER_LINK_REPOSITORY_PORT)
    private readonly linkRepository: TrainerLinkRepositoryPort,
    @Inject(USER_REPOSITORY_PORT)
    private readonly userRepository: UserRepository,
  ) {}

  async execute(input: GetActiveLinksInput): Promise<GetActiveLinksOutput> {
    const pagination: Pagination = {
      page: input.page ?? 1,
      limit: input.limit ?? 10,
    };

    const result = await this.linkRepository.findActiveByTrainerId(
      input.actorId,
      pagination,
    );

    const clientIds = result.items.map((l) => l.clientId);
    const uniqueClientIds = [...new Set(clientIds)];

    const clients = await Promise.all(
      uniqueClientIds.map((id) => this.userRepository.findById(id)),
    );

    const clientMap = new Map(clients.filter(Boolean).map((c) => [c!.id, c!]));

    const items: ActiveLinkWithClientInfo[] = result.items.map((l) => {
      const client = clientMap.get(l.clientId);
      return {
        linkId: l.id,
        clientId: l.clientId,
        clientName: client?.username ?? 'Unknown',
        linkStatus: 'Activa',
        activatedAt: l.activatedAt,
      };
    });

    const validItems = items.filter(
      (i) => i.clientName && i.clientName !== 'Unknown',
    );

    return {
      items: validItems,
      total: validItems.length,
      page: result.page,
      limit: result.limit,
    };
  }
}
