import { TrainerLink } from '../entities/trainer-link.entity';
import {
  Pagination,
  PaginatedResult,
} from './trainer-link-request.repository.port';

export const TRAINER_LINK_REPOSITORY_PORT = Symbol(
  'TRAINER_LINK_REPOSITORY_PORT',
);

export interface TrainerLinkRepositoryPort {
  save(link: TrainerLink): Promise<TrainerLink>;
  findById(id: string): Promise<TrainerLink | null>;
  findByClientAndTrainer(
    clientId: string,
    trainerId: string,
  ): Promise<TrainerLink | null>;
  findActiveByTrainerId(
    trainerId: string,
    pagination: Pagination,
  ): Promise<PaginatedResult<TrainerLink>>;
  findActiveByClientId(clientId: string): Promise<TrainerLink[]>;
  countActiveByClientId(clientId: string): Promise<number>;
  countActiveByTrainerId(trainerId: string): Promise<number>;
}
