import { Controller, Get, Query, Inject, UseGuards } from '@nestjs/common';
import {
  ListExerciseCatalogUseCase,
  EXERCISE_CATALOG_REPOSITORY_PORT,
} from '../../../application/use-cases/list-exercise-catalog/list-exercise-catalog.use-case';
import { ExerciseCatalogRepository } from '../../../domain/repositories/exercise-catalog.repository';
import { ExerciseCatalogEntryResponseDto } from '../dtos/exercise-catalog.response';
import { JwtAuthGuard } from '../../../../auth/presentation/http/guards/jwt-auth.guard';

@Controller('exercises')
@UseGuards(JwtAuthGuard)
export class ExerciseCatalogController {
  private readonly listExerciseCatalogUseCase: ListExerciseCatalogUseCase;

  constructor(
    @Inject(EXERCISE_CATALOG_REPOSITORY_PORT)
    exerciseCatalogRepository: ExerciseCatalogRepository,
  ) {
    this.listExerciseCatalogUseCase = new ListExerciseCatalogUseCase(
      exerciseCatalogRepository,
    );
  }

  @Get('catalog')
  public async list(
    @Query('search') search?: string,
    @Query('category') category?: string,
    @Query('primaryMuscleGroup') primaryMuscleGroup?: string,
    @Query('equipment') equipment?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ): Promise<{
    data: ExerciseCatalogEntryResponseDto[];
    total: number;
    page: number;
    limit: number;
  }> {
    const result = await this.listExerciseCatalogUseCase.execute({
      search,
      category,
      primaryMuscleGroup,
      equipment,
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    });

    return {
      data: result.data.map((item) => {
        const dto = new ExerciseCatalogEntryResponseDto();
        dto.id = item.id;
        dto.name = item.name;
        dto.category = item.category;
        dto.primaryMuscleGroup = item.primaryMuscleGroup;
        dto.equipment = item.equipment;
        return dto;
      }),
      total: result.total,
      page: result.page,
      limit: result.limit,
    };
  }
}
