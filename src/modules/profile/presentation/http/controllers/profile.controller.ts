import {
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  Patch,
  Body,
  Post,
  Query,
  UseFilters,
} from '@nestjs/common';
import { CurrentActor } from '../../../application/ports/current-actor.port';
import { ProfilePublicationQueryPort } from '../../../application/ports/profile-publication-query.port';
import {
  FollowProfileUseCase,
  PROFILE_CURRENT_ACTOR_PORT,
  PROFILE_FOLLOW_REPOSITORY_PORT,
  PROFILE_PUBLICATION_QUERY_PORT,
  SOCIAL_PROFILE_REPOSITORY_PORT,
} from '../../../application/use-cases/follow-profile/follow-profile.use-case';
import { GetPublicProfileUseCase } from '../../../application/use-cases/get-public-profile/get-public-profile.use-case';
import { ListProfileFollowersUseCase } from '../../../application/use-cases/list-profile-followers/list-profile-followers.use-case';
import { ListProfileFollowingUseCase } from '../../../application/use-cases/list-profile-following/list-profile-following.use-case';
import { ListProfilePublicationsUseCase } from '../../../application/use-cases/list-profile-publications/list-profile-publications.use-case';
import { SearchProfilesUseCase } from '../../../application/use-cases/search-profiles/search-profiles.use-case';
import { UnfollowProfileUseCase } from '../../../application/use-cases/unfollow-profile/unfollow-profile.use-case';
import { UpdateOwnProfileUseCase } from '../../../application/use-cases/update-own-profile/update-own-profile.use-case';
import { ProfileFollowRepository } from '../../../domain/repositories/profile-follow.repository';
import { SocialProfileRepository } from '../../../domain/repositories/social-profile.repository';
import { ProfileDomainErrorFilter } from '../filters/profile-domain-error.filter';
import { ListProfilePublicationsRequestDto } from '../requests/list-profile-publications.request';
import { SearchProfilesRequestDto } from '../requests/search-profiles.request';
import { UpdateOwnProfileRequestDto } from '../requests/update-own-profile.request';
import {
  FollowProfileResponseDto,
  ListProfilePublicationsResponseDto,
  ListProfilesResponseDto,
  ProfileResponseDto,
  ProfilePresenter,
  PublicProfileResponseDto,
} from '../responses/profile.response';

@Controller('profiles')
@UseFilters(ProfileDomainErrorFilter)
export class ProfileController {
  private readonly followProfileUseCase: FollowProfileUseCase;
  private readonly unfollowProfileUseCase: UnfollowProfileUseCase;
  private readonly getPublicProfileUseCase: GetPublicProfileUseCase;
  private readonly listFollowersUseCase: ListProfileFollowersUseCase;
  private readonly listFollowingUseCase: ListProfileFollowingUseCase;
  private readonly searchProfilesUseCase: SearchProfilesUseCase;
  private readonly listPublicationsUseCase: ListProfilePublicationsUseCase;
  private readonly updateOwnProfileUseCase: UpdateOwnProfileUseCase;

  constructor(
    @Inject(SOCIAL_PROFILE_REPOSITORY_PORT)
    profileRepository: SocialProfileRepository,
    @Inject(PROFILE_FOLLOW_REPOSITORY_PORT)
    followRepository: ProfileFollowRepository,
    @Inject(PROFILE_PUBLICATION_QUERY_PORT)
    publicationQuery: ProfilePublicationQueryPort,
    @Inject(PROFILE_CURRENT_ACTOR_PORT)
    private readonly currentActor: CurrentActor,
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
    );
  }

  @Get('search')
  public async search(
    @Query() query: SearchProfilesRequestDto,
  ): Promise<ListProfilesResponseDto> {
    const profiles = await this.searchProfilesUseCase.execute(
      this.currentActor,
      { query: query.q },
    );
    return ProfilePresenter.listToHttp(profiles);
  }

  @Patch('me')
  public async updateMe(
    @Body() dto: UpdateOwnProfileRequestDto,
  ): Promise<ProfileResponseDto> {
    const profile = await this.updateOwnProfileUseCase.execute(
      this.currentActor,
      { bio: dto.bio, avatarUrl: dto.avatarUrl },
    );
    return ProfilePresenter.toHttp(profile);
  }

  @Get(':userId')
  public async getPublicProfile(
    @Param('userId') userId: string,
  ): Promise<PublicProfileResponseDto> {
    const profile = await this.getPublicProfileUseCase.execute(
      this.currentActor,
      { userId },
    );
    return ProfilePresenter.publicToHttp(profile);
  }

  @Post(':userId/follow')
  public async follow(
    @Param('userId') userId: string,
  ): Promise<FollowProfileResponseDto> {
    const result = await this.followProfileUseCase.execute(this.currentActor, {
      targetUserId: userId,
    });

    const response = new FollowProfileResponseDto();
    response.followerUserId = result.followerUserId;
    response.followedUserId = result.followedUserId;
    response.following = result.following;
    return response;
  }

  @Delete(':userId/follow')
  public async unfollow(
    @Param('userId') userId: string,
  ): Promise<FollowProfileResponseDto> {
    const result = await this.unfollowProfileUseCase.execute(
      this.currentActor,
      { targetUserId: userId },
    );

    const response = new FollowProfileResponseDto();
    response.followerUserId = result.followerUserId;
    response.followedUserId = result.followedUserId;
    response.following = result.following;
    return response;
  }

  @Get(':userId/followers')
  public async followers(
    @Param('userId') userId: string,
  ): Promise<ListProfilesResponseDto> {
    const profiles = await this.listFollowersUseCase.execute(
      this.currentActor,
      { userId },
    );
    return ProfilePresenter.listToHttp(profiles);
  }

  @Get(':userId/following')
  public async following(
    @Param('userId') userId: string,
  ): Promise<ListProfilesResponseDto> {
    const profiles = await this.listFollowingUseCase.execute(
      this.currentActor,
      { userId },
    );
    return ProfilePresenter.listToHttp(profiles);
  }

  @Get(':userId/publications')
  public async publications(
    @Param('userId') userId: string,
    @Query() query: ListProfilePublicationsRequestDto,
  ): Promise<ListProfilePublicationsResponseDto> {
    const page = await this.listPublicationsUseCase.execute(this.currentActor, {
      userId,
      limit: query.limit,
      offset: query.offset,
    });
    return ProfilePresenter.publicationsToHttp(page);
  }
}
