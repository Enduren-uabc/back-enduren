import { ExerciseCatalogRepository } from '../../../domain/repositories/exercise-catalog.repository';
import { ExerciseCatalogEntry } from '../../../domain/entities/exercise-catalog-entry.entity';

export const EXERCISE_CATALOG_REPOSITORY_PORT = Symbol(
  'EXERCISE_CATALOG_REPOSITORY_PORT',
);

export interface ListExerciseCatalogInput {
  search?: string;
  category?: string;
  primaryMuscleGroup?: string;
  equipment?: string;
  page?: number;
  limit?: number;
}

export interface ListExerciseCatalogOutput {
  data: Array<{
    id: string;
    name: string;
    category: string;
    primaryMuscleGroup: string;
    equipment: string;
    videoUrl: string | null;
    imageUrl: string | null;
  }>;
  total: number;
  page: number;
  limit: number;
}

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;

export class ListExerciseCatalogUseCase {
  constructor(
    private readonly exerciseCatalogRepository: ExerciseCatalogRepository,
  ) {}

  public async execute(
    input: ListExerciseCatalogInput,
  ): Promise<ListExerciseCatalogOutput> {
    const page = input.page ?? DEFAULT_PAGE;
    const limit = input.limit ?? DEFAULT_LIMIT;

    const result = await this.exerciseCatalogRepository.findAll({
      search: input.search,
      category: input.category,
      primaryMuscleGroup: input.primaryMuscleGroup,
      equipment: input.equipment,
      page,
      limit,
    });

    return {
      data: result.data.map((entry) => this.mapEntry(entry)),
      total: result.total,
      page: result.page,
      limit: result.limit,
    };
  }

  private mapEntry(entry: ExerciseCatalogEntry): {
    id: string;
    name: string;
    category: string;
    primaryMuscleGroup: string;
    equipment: string;
    videoUrl: string | null;
    imageUrl: string | null;
  } {
    return {
      id: entry.id,
      name: entry.name,
      category: entry.category,
      primaryMuscleGroup: entry.primaryMuscleGroup,
      equipment: entry.equipment,
      videoUrl: entry.videoUrl,
      imageUrl: entry.imageUrl,
    };
  }
}
