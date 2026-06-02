import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ListExerciseCatalogUseCase } from '../../../application/use-cases/list-exercise-catalog/list-exercise-catalog.use-case';
import { ExerciseCatalogEntryResponseDto } from '../dtos/exercise-catalog.response';
import { JwtAuthGuard } from '../../../../auth/presentation/http/guards/jwt-auth.guard';

@Controller('exercises')
@UseGuards(JwtAuthGuard)
export class ExerciseCatalogController {
  constructor(
    private readonly listExerciseCatalogUseCase: ListExerciseCatalogUseCase,
  ) {}

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
      page: page ? Number.parseInt(page, 10) : undefined,
      limit: limit ? Number.parseInt(limit, 10) : undefined,
    });

    return {
      data: result.data.map((item) => {
        const dto = new ExerciseCatalogEntryResponseDto();
        dto.id = item.id;
        dto.name = item.name;
        dto.category = item.category;
        dto.primaryMuscleGroup = item.primaryMuscleGroup;
        dto.equipment = item.equipment;
        dto.videoUrl = item.videoUrl;
        dto.imageUrl = item.imageUrl;
        return dto;
      }),
      total: result.total,
      page: result.page,
      limit: result.limit,
    };
  }
}
