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

export interface ListSentLinkRequestsInput {
  actorId: string;
  status?: LinkRequestStatus;
  page?: number;
  limit?: number;
}

export interface LinkRequestWithTrainerInfo {
  id: string;
  trainerId: string;
  trainerName: string;
  trainerCode: string | null;
  status: LinkRequestStatus;
  message: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ListSentLinkRequestsOutput {
  items: LinkRequestWithTrainerInfo[];
  total: number;
  page: number;
  limit: number;
}

@Injectable()
export class ListSentLinkRequestsUseCase {
  constructor(
    @Inject(TRAINER_LINK_REQUEST_REPOSITORY_PORT)
    private readonly linkRequestRepository: TrainerLinkRequestRepositoryPort,
    @Inject(USER_REPOSITORY_PORT)
    private readonly userRepository: UserRepository,
  ) {}

  async execute(
    input: ListSentLinkRequestsInput,
  ): Promise<ListSentLinkRequestsOutput> {
    const pagination: Pagination = {
      page: input.page ?? 1,
      limit: input.limit ?? 10,
    };

    const result = await this.linkRequestRepository.findSentByClientId(
      input.actorId,
      { status: input.status },
      pagination,
    );

    const trainerIds = result.items.map((r) => r.trainerId);
    const uniqueTrainerIds = [...new Set(trainerIds)];

    const trainers = await Promise.all(
      uniqueTrainerIds.map((id) => this.userRepository.findById(id)),
    );

    const trainerMap = new Map(
      trainers.filter(Boolean).map((t) => [t!.id, t!]),
    );

    const items: LinkRequestWithTrainerInfo[] = result.items.map((r) => {
      const trainer = trainerMap.get(r.trainerId);
      return {
        id: r.id,
        trainerId: r.trainerId,
        trainerName: trainer?.username ?? 'Unknown',
        trainerCode: trainer?.trainerCode ?? null,
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
