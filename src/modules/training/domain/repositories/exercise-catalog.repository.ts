import { ExerciseCatalogEntry } from '../entities/exercise-catalog-entry.entity';

export interface ExerciseCatalogQuery {
  search?: string;
  category?: string;
  primaryMuscleGroup?: string;
  equipment?: string;
  page?: number;
  limit?: number;
}

export interface PaginatedExerciseCatalogResult {
  data: ExerciseCatalogEntry[];
  total: number;
  page: number;
  limit: number;
}

export interface ExerciseCatalogRepository {
  findAll(query: ExerciseCatalogQuery): Promise<PaginatedExerciseCatalogResult>;
}
