import { Inject, Injectable } from '@nestjs/common';
import {
  TRAINER_SEARCH_REPOSITORY_PORT,
  TrainerSearchRepositoryPort,
  TrainerSearchResult,
} from '../../../domain/repositories/trainer-search.repository.port';
import { Pagination } from '../../../domain/repositories/trainer-link-request.repository.port';

export interface SearchTrainersInput {
  query: string;
  page?: number;
  limit?: number;
}

export interface SearchTrainersOutput {
  items: TrainerSearchResult[];
  total: number;
  page: number;
  limit: number;
}

@Injectable()
export class SearchTrainersUseCase {
  constructor(
    @Inject(TRAINER_SEARCH_REPOSITORY_PORT)
    private readonly searchRepository: TrainerSearchRepositoryPort,
  ) {}

  async execute(input: SearchTrainersInput): Promise<SearchTrainersOutput> {
    if (!input.query || input.query.trim().length < 2) {
      return { items: [], total: 0, page: 1, limit: input.limit ?? 10 };
    }

    const pagination: Pagination = {
      page: input.page ?? 1,
      limit: input.limit ?? 10,
    };

    const results = await this.searchRepository.searchVerifiedTrainers(
      input.query.trim(),
      pagination,
    );

    return {
      items: results.items,
      total: results.total,
      page: results.page,
      limit: results.limit,
    };
  }
}
