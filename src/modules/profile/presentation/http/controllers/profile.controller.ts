import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  UseFilters,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../../../auth/presentation/http/guards/jwt-auth.guard';
import { CurrentUser } from '../../../../auth/presentation/http/decorators/current-user.decorator';
import { JwtPayload } from '../../../../auth/presentation/http/strategies/jwt.strategy';
import { CreateOrUpdateProfileUseCase } from '../../../application/use-cases/create-or-update-profile/create-or-update-profile.use-case';
import { GetProfileUseCase } from '../../../application/use-cases/get-profile/get-profile.use-case';
import { CheckOnboardingStatusUseCase } from '../../../application/use-cases/check-onboarding-status/check-onboarding-status.use-case';
import { CreateProfileRequestDto } from '../dtos/create-profile.request';
import { ProfileResponseDto } from '../dtos/profile.response';
import { ProfileDomainErrorFilter } from '../filters/profile-domain-error.filter';

@Controller()
@UseGuards(JwtAuthGuard)
@UseFilters(ProfileDomainErrorFilter)
export class ProfileController {
  constructor(
    private readonly createOrUpdateProfileUseCase: CreateOrUpdateProfileUseCase,
    private readonly getProfileUseCase: GetProfileUseCase,
    private readonly checkOnboardingStatusUseCase: CheckOnboardingStatusUseCase,
  ) {}

  @Post('onboarding/profile')
  @HttpCode(HttpStatus.OK)
  async createOrUpdate(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateProfileRequestDto,
  ): Promise<ProfileResponseDto> {
    const result = await this.createOrUpdateProfileUseCase.execute({
      userId: user.sub,
      fullName: dto.fullName,
      birthDate: new Date(dto.birthDate),
      gender: dto.gender,
      weight: dto.weight,
      height: dto.height,
      experienceLevel: dto.experienceLevel,
      mainGoal: dto.mainGoal,
      daysAvailablePerWeek: dto.daysAvailablePerWeek,
      weightUnit: dto.weightUnit,
    });

    return this.mapToResponse(result);
  }

  @Get('profile')
  async getProfile(
    @CurrentUser() user: JwtPayload,
  ): Promise<ProfileResponseDto | null> {
    const result = await this.getProfileUseCase.execute(user.sub);

    if (!result) {
      return null;
    }

    return this.mapToResponse(result);
  }

  @Get('onboarding/status')
  async checkOnboardingStatus(
    @CurrentUser() user: JwtPayload,
  ): Promise<{ completed: boolean }> {
    return this.checkOnboardingStatusUseCase.execute(user.sub);
  }

  private mapToResponse(result: {
    id: string;
    userId: string;
    fullName: string;
    birthDate: Date;
    gender: string;
    weight: number;
    height: number;
    experienceLevel: string;
    mainGoal: string;
    daysAvailablePerWeek: number;
    weightUnit: string;
    onboardingCompleted: boolean;
    createdAt: Date;
    updatedAt: Date;
  }): ProfileResponseDto {
    const response = new ProfileResponseDto();
    response.id = result.id;
    response.userId = result.userId;
    response.fullName = result.fullName;
    response.birthDate =
      result.birthDate instanceof Date
        ? result.birthDate.toISOString().split('T')[0]
        : String(result.birthDate).split('T')[0];
    response.gender = result.gender;
    response.weight = result.weight;
    response.height = result.height;
    response.experienceLevel = result.experienceLevel;
    response.mainGoal = result.mainGoal;
    response.daysAvailablePerWeek = result.daysAvailablePerWeek;
    response.weightUnit = result.weightUnit;
    response.onboardingCompleted = result.onboardingCompleted;
    response.createdAt = result.createdAt;
    response.updatedAt = result.updatedAt;
    return response;
  }
}
