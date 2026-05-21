import { Inject, Injectable } from '@nestjs/common';
import {
  TRAINER_LINK_REQUEST_REPOSITORY_PORT,
  TrainerLinkRequestRepositoryPort,
  Pagination,
} from '../../../domain/repositories/trainer-link-request.repository.port';
import { LinkRequestStatus } from '../../../domain/value-objects/link-status.vo';
import {
  USER_REPOSITORY_PORT,
  UserRepository,
} from '../../../../users/domain/repositories/user.repository';

export interface ListReceivedLinkRequestsInput {
  actorId: string;
  status?: LinkRequestStatus;
  page?: number;
  limit?: number;
}

export interface LinkRequestWithClientInfo {
  id: string;
  clientId: string;
  clientName: string;
  status: LinkRequestStatus;
  message: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ListReceivedLinkRequestsOutput {
  items: LinkRequestWithClientInfo[];
  total: number;
  page: number;
  limit: number;
}

@Injectable()
export class ListReceivedLinkRequestsUseCase {
  constructor(
    @Inject(TRAINER_LINK_REQUEST_REPOSITORY_PORT)
    private readonly linkRequestRepository: TrainerLinkRequestRepositoryPort,
    @Inject(USER_REPOSITORY_PORT)
    private readonly userRepository: UserRepository,
  ) {}

  async execute(
    input: ListReceivedLinkRequestsInput,
  ): Promise<ListReceivedLinkRequestsOutput> {
    const pagination: Pagination = {
      page: input.page ?? 1,
      limit: input.limit ?? 10,
    };

    const result = await this.linkRequestRepository.findReceivedByTrainerId(
      input.actorId,
      { status: input.status },
      pagination,
    );

    const clientIds = result.items.map((r) => r.clientId);
    const uniqueClientIds = [...new Set(clientIds)];

    const clients = await Promise.all(
      uniqueClientIds.map((id) => this.userRepository.findById(id)),
    );

    const clientMap = new Map(clients.filter(Boolean).map((c) => [c!.id, c!]));

    const items: LinkRequestWithClientInfo[] = result.items.map((r) => {
      const client = clientMap.get(r.clientId);
      return {
        id: r.id,
        clientId: r.clientId,
        clientName: client?.username ?? 'Unknown',
        status: r.status,
        message: r.message,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
      };
    });

    return {
      items,
      total: result.total,
      page: result.page,
      limit: result.limit,
    };
  }
}
