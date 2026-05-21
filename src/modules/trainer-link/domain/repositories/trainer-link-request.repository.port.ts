import { TrainerLinkRequest } from '../entities/trainer-link-request.entity';
import { LinkRequestStatus } from '../value-objects/link-status.vo';

export const TRAINER_LINK_REQUEST_REPOSITORY_PORT = Symbol(
  'TRAINER_LINK_REQUEST_REPOSITORY_PORT',
);

export interface Pagination {
  page: number;
  limit: number;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}

export interface TrainerLinkRequestRepositoryPort {
  save(request: TrainerLinkRequest): Promise<TrainerLinkRequest>;
  findById(id: string): Promise<TrainerLinkRequest | null>;
  findPendingByClientAndTrainer(
    clientId: string,
    trainerId: string,
  ): Promise<TrainerLinkRequest | null>;
  findSentByClientId(
    clientId: string,
    filters: { status?: LinkRequestStatus },
    pagination: Pagination,
  ): Promise<PaginatedResult<TrainerLinkRequest>>;
  findReceivedByTrainerId(
    trainerId: string,
    filters: { status?: LinkRequestStatus },
    pagination: Pagination,
  ): Promise<PaginatedResult<TrainerLinkRequest>>;
  hasPendingRequest(clientId: string, trainerId: string): Promise<boolean>;
}
