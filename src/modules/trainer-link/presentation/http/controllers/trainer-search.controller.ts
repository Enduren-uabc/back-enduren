import { Controller, Get, Param, Query, UseFilters } from '@nestjs/common';
import { SearchTrainersUseCase } from '../../../application/use-cases/search-trainers/search-trainers.use-case';
import { GetPublicTrainerProfileUseCase } from '../../../application/use-cases/get-public-trainer-profile/get-public-trainer-profile.use-case';
import { SearchTrainersRequestDto } from '../dtos/search-trainers.request';
import { TrainerSearchResultResponseDto } from '../dtos/trainer-search-result.response';
import { PublicTrainerProfileResponseDto } from '../dtos/public-trainer-profile.response';
import { TrainerLinkErrorFilter } from '../filters/trainer-link-error.filter';
import { Public } from '../../../../auth/presentation/http/decorators/public.decorator';

@Controller('trainers')
@UseFilters(TrainerLinkErrorFilter)
export class TrainerSearchController {
  constructor(
    private readonly searchTrainersUseCase: SearchTrainersUseCase,
    private readonly getPublicTrainerProfileUseCase: GetPublicTrainerProfileUseCase,
  ) {}

  @Get('search')
  @Public()
  async search(@Query() query: SearchTrainersRequestDto): Promise<{
    items: TrainerSearchResultResponseDto[];
    total: number;
    page: number;
    limit: number;
  }> {
    const result = await this.searchTrainersUseCase.execute({
      query: query.q,
      page: query.page ? Number.parseInt(query.page, 10) : 1,
      limit: query.limit ? Number.parseInt(query.limit, 10) : 10,
    });

    return {
      items: result.items.map((item) => ({
        userId: item.userId,
        trainerCode: item.trainerCode,
        displayName: item.displayName,
        specialties: item.specialties,
        yearsOfExperience: item.yearsOfExperience,
        shortBio: item.shortBio,
        profileImageUrl: item.profileImageUrl,
      })),
      total: result.total,
      page: result.page,
      limit: result.limit,
    };
  }

  @Get(':trainerId/public-profile')
  @Public()
  async getPublicProfile(
    @Param('trainerId') trainerId: string,
  ): Promise<PublicTrainerProfileResponseDto> {
    const result = await this.getPublicTrainerProfileUseCase.execute({
      trainerId,
    });
    return {
      userId: result.userId,
      trainerCode: result.trainerCode,
      displayName: result.displayName,
      specialties: result.specialties,
      yearsOfExperience: result.yearsOfExperience,
      shortBio: result.shortBio,
      profileImageUrl: result.profileImageUrl,
    };
  }
}
