import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Param,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseFilters,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CurrentUser } from '../../../../auth/presentation/http/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../../../auth/presentation/http/guards/jwt-auth.guard';
import { JwtPayload } from '../../../../auth/presentation/http/strategies/jwt.strategy';
import { CurrentActor } from '../../../application/ports/current-actor.port';
import { ProfilePublicationQueryPort } from '../../../application/ports/profile-publication-query.port';
import {
  USER_REPOSITORY_PORT,
  UserRepository,
} from '../../../../../modules/users/domain/repositories/user.repository';
import { CheckOnboardingStatusUseCase } from '../../../application/use-cases/check-onboarding-status/check-onboarding-status.use-case';
import { CreateOrUpdateProfileUseCase } from '../../../application/use-cases/create-or-update-profile/create-or-update-profile.use-case';
import {
  FollowProfileUseCase,
  PROFILE_FOLLOW_REPOSITORY_PORT,
  PROFILE_PUBLICATION_QUERY_PORT,
  SOCIAL_PROFILE_REPOSITORY_PORT,
} from '../../../application/use-cases/follow-profile/follow-profile.use-case';
import { GetProfileUseCase } from '../../../application/use-cases/get-profile/get-profile.use-case';
import { GetPublicProfileUseCase } from '../../../application/use-cases/get-public-profile/get-public-profile.use-case';
import { ListProfileFollowersUseCase } from '../../../application/use-cases/list-profile-followers/list-profile-followers.use-case';
import { ListProfileFollowingUseCase } from '../../../application/use-cases/list-profile-following/list-profile-following.use-case';
import { ListProfilePublicationsUseCase } from '../../../application/use-cases/list-profile-publications/list-profile-publications.use-case';
import { SearchProfilesUseCase } from '../../../application/use-cases/search-profiles/search-profiles.use-case';
import { UnfollowProfileUseCase } from '../../../application/use-cases/unfollow-profile/unfollow-profile.use-case';
import { UpdateOwnProfileUseCase } from '../../../application/use-cases/update-own-profile/update-own-profile.use-case';
import { UploadAvatarUseCase } from '../../../application/use-cases/upload-avatar/upload-avatar.use-case';
import { ProfileFollowRepository } from '../../../domain/repositories/profile-follow.repository';
import { SocialProfileRepository } from '../../../domain/repositories/social-profile.repository';
import { CreateProfileRequestDto } from '../dtos/create-profile.request';
import { ProfileResponseDto as OnboardingProfileResponseDto } from '../dtos/profile.response';
import { ProfileDomainErrorFilter } from '../filters/profile-domain-error.filter';
import { ListProfilePublicationsRequestDto } from '../requests/list-profile-publications.request';
import { SearchProfilesRequestDto } from '../requests/search-profiles.request';
import { UpdateOwnProfileRequestDto } from '../requests/update-own-profile.request';
import {
  FollowProfileResponseDto,
  ListProfilePublicationsResponseDto,
  ListProfilesResponseDto,
  ProfilePresenter,
  ProfileResponseDto as SocialProfileResponseDto,
  PublicProfileResponseDto,
} from '../responses/profile.response';

@Controller()
@UseGuards(JwtAuthGuard)
@UseFilters(ProfileDomainErrorFilter)
export class ProfileController {
  private readonly followProfileUseCase: FollowProfileUseCase;
  private readonly unfollowProfileUseCase: UnfollowProfileUseCase;
  private readonly getPublicProfileUseCase: GetPublicProfileUseCase;
  private readonly listFollowersUseCase: ListProfileFollowersUseCase;
  private readonly listFollowingUseCase: ListProfileFollowingUseCase;
  private readonly searchProfilesUseCase: SearchProfilesUseCase;
  private readonly updateOwnProfileUseCase: UpdateOwnProfileUseCase;
  private readonly listPublicationsUseCase: ListProfilePublicationsUseCase;

  constructor(
    @Inject(SOCIAL_PROFILE_REPOSITORY_PORT)
    profileRepository: SocialProfileRepository,
    @Inject(PROFILE_FOLLOW_REPOSITORY_PORT)
    followRepository: ProfileFollowRepository,
    @Inject(PROFILE_PUBLICATION_QUERY_PORT)
    publicationQuery: ProfilePublicationQueryPort,
    @Inject(USER_REPOSITORY_PORT)
    userRepository: UserRepository,
    private readonly createOrUpdateProfileUseCase: CreateOrUpdateProfileUseCase,
    private readonly getProfileUseCase: GetProfileUseCase,
    private readonly checkOnboardingStatusUseCase: CheckOnboardingStatusUseCase,
    private readonly uploadAvatarUseCase: UploadAvatarUseCase,
  ) {
    this.followProfileUseCase = new FollowProfileUseCase(
      profileRepository,
      followRepository,
    );
    this.unfollowProfileUseCase = new UnfollowProfileUseCase(
      profileRepository,
      followRepository,
    );
    this.getPublicProfileUseCase = new GetPublicProfileUseCase(
      profileRepository,
      followRepository,
      userRepository,
    );
    this.listFollowersUseCase = new ListProfileFollowersUseCase(
      profileRepository,
      followRepository,
    );
    this.listFollowingUseCase = new ListProfileFollowingUseCase(
      profileRepository,
      followRepository,
    );
    this.searchProfilesUseCase = new SearchProfilesUseCase(profileRepository);
    this.updateOwnProfileUseCase = new UpdateOwnProfileUseCase(
      profileRepository,
    );
    this.listPublicationsUseCase = new ListProfilePublicationsUseCase(
      profileRepository,
      publicationQuery,
      userRepository,
    );
  }

  @Post('onboarding/profile')
  @HttpCode(HttpStatus.OK)
  public async createOrUpdate(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateProfileRequestDto,
  ): Promise<OnboardingProfileResponseDto> {
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
      defaultTrainingStrategyKey: dto.defaultTrainingStrategyKey,
    });

    return this.mapToOnboardingResponse(result);
  }

  @Get('profile')
  public async getOwnProfile(
    @CurrentUser() user: JwtPayload,
  ): Promise<OnboardingProfileResponseDto | null> {
    const result = await this.getProfileUseCase.execute(user.sub);

    if (!result) {
      return null;
    }

    return this.mapToOnboardingResponse(result);
  }

  @Get('onboarding/status')
  public async checkOnboardingStatus(
    @CurrentUser() user: JwtPayload,
  ): Promise<{ completed: boolean }> {
    return this.checkOnboardingStatusUseCase.execute(user.sub);
  }

  @Get('profiles/search')
  public async search(
    @CurrentUser() user: JwtPayload,
    @Query() query: SearchProfilesRequestDto,
  ): Promise<ListProfilesResponseDto> {
    const profiles = await this.searchProfilesUseCase.execute(
      this.getActor(user),
      { query: query.q },
    );
    return ProfilePresenter.listToHttp(profiles);
  }

  @Patch('profiles/me')
  public async updateMe(
    @CurrentUser() user: JwtPayload,
    @Body() dto: UpdateOwnProfileRequestDto,
  ): Promise<SocialProfileResponseDto> {
    const profile = await this.updateOwnProfileUseCase.execute(
      this.getActor(user),
      { bio: dto.bio, avatarUrl: dto.avatarUrl },
    );
    return ProfilePresenter.toHttp(profile);
  }

  @Post('profiles/me/avatar')
  @UseInterceptors(FileInterceptor('avatar'))
  public async uploadAvatar(
    @CurrentUser() user: JwtPayload,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<SocialProfileResponseDto> {
    const profile = await this.uploadAvatarUseCase.execute({
      actor: this.getActor(user),
      file,
    });
    return ProfilePresenter.toHttp(profile);
  }

  @Get('profiles/:userId')
  public async getPublicProfile(
    @CurrentUser() user: JwtPayload,
    @Param('userId') userId: string,
  ): Promise<PublicProfileResponseDto> {
    const profile = await this.getPublicProfileUseCase.execute(
      this.getActor(user),
      { userId },
    );
    return ProfilePresenter.publicToHttp(profile);
  }

  @Post('profiles/:userId/follow')
  public async follow(
    @CurrentUser() user: JwtPayload,
    @Param('userId') userId: string,
  ): Promise<FollowProfileResponseDto> {
    const result = await this.followProfileUseCase.execute(
      this.getActor(user),
      {
        targetUserId: userId,
      },
    );

    const response = new FollowProfileResponseDto();
    response.followerUserId = result.followerUserId;
    response.followedUserId = result.followedUserId;
    response.following = result.following;
    return response;
  }

  @Delete('profiles/:userId/follow')
  public async unfollow(
    @CurrentUser() user: JwtPayload,
    @Param('userId') userId: string,
  ): Promise<FollowProfileResponseDto> {
    const result = await this.unfollowProfileUseCase.execute(
      this.getActor(user),
      { targetUserId: userId },
    );

    const response = new FollowProfileResponseDto();
    response.followerUserId = result.followerUserId;
    response.followedUserId = result.followedUserId;
    response.following = result.following;
    return response;
  }

  @Get('profiles/:userId/followers')
  public async followers(
    @CurrentUser() user: JwtPayload,
    @Param('userId') userId: string,
  ): Promise<ListProfilesResponseDto> {
    const profiles = await this.listFollowersUseCase.execute(
      this.getActor(user),
      { userId },
    );
    return ProfilePresenter.listToHttp(profiles);
  }

  @Get('profiles/:userId/following')
  public async following(
    @CurrentUser() user: JwtPayload,
    @Param('userId') userId: string,
  ): Promise<ListProfilesResponseDto> {
    const profiles = await this.listFollowingUseCase.execute(
      this.getActor(user),
      { userId },
    );
    return ProfilePresenter.listToHttp(profiles);
  }

  @Get('profiles/:userId/publications')
  public async publications(
    @CurrentUser() user: JwtPayload,
    @Param('userId') userId: string,
    @Query() query: ListProfilePublicationsRequestDto,
  ): Promise<ListProfilePublicationsResponseDto> {
    const page = await this.listPublicationsUseCase.execute(
      this.getActor(user),
      {
        userId,
        limit: query.limit,
        offset: query.offset,
      },
    );
    return ProfilePresenter.publicationsToHttp(page);
  }

  private getActor(user: JwtPayload): CurrentActor {
    return { userId: user.sub };
  }

  private mapToOnboardingResponse(result: {
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
    defaultTrainingStrategyKey: string | null;
    onboardingCompleted: boolean;
    createdAt: Date;
    updatedAt: Date;
  }): OnboardingProfileResponseDto {
    const response = new OnboardingProfileResponseDto();
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
    response.defaultTrainingStrategyKey = result.defaultTrainingStrategyKey;
    response.onboardingCompleted = result.onboardingCompleted;
    response.createdAt = result.createdAt;
    response.updatedAt = result.updatedAt;
    return response;
  }
}
