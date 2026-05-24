import { TrainerAssignedRoutine } from '../entities/trainer-assigned-routine.entity';

export const TRAINER_ASSIGNED_ROUTINE_REPOSITORY_PORT = Symbol(
  'TRAINER_ASSIGNED_ROUTINE_REPOSITORY_PORT',
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

export interface TrainerAssignedRoutineRepositoryPort {
  save(assigned: TrainerAssignedRoutine): Promise<TrainerAssignedRoutine>;
  findById(id: string): Promise<TrainerAssignedRoutine | null>;
  findActiveByClientId(
    clientId: string,
  ): Promise<TrainerAssignedRoutine | null>;
  findByTrainerAndClient(
    trainerId: string,
    clientId: string,
    pagination?: Pagination,
  ): Promise<PaginatedResult<TrainerAssignedRoutine>>;
  findByIdAndTrainer(
    assignedId: string,
    trainerId: string,
  ): Promise<TrainerAssignedRoutine | null>;
  findActiveByClientAndTrainer(
    clientId: string,
    trainerId: string,
  ): Promise<TrainerAssignedRoutine | null>;
}
