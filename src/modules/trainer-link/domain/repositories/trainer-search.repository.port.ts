import {
  Pagination,
  PaginatedResult,
} from './trainer-link-request.repository.port';

export const TRAINER_SEARCH_REPOSITORY_PORT = Symbol(
  'TRAINER_SEARCH_REPOSITORY_PORT',
);

export interface TrainerSearchResult {
  userId: string;
  trainerCode: string;
  displayName: string;
  specialties: string[];
  yearsOfExperience: number;
  shortBio: string | null;
  profileImageUrl: string | null;
}

export interface TrainerSearchRepositoryPort {
  searchVerifiedTrainers(
    query: string,
    pagination: Pagination,
  ): Promise<PaginatedResult<TrainerSearchResult>>;
  findByTrainerCode(code: string): Promise<{
    userId: string;
    trainerCode: string;
    displayName: string;
    role: string;
  } | null>;
}
