import {
  ProfileDomainError,
  ProfileErrorCode,
} from '../../../domain/errors/profile-domain.error';
import { ProfileFollowRepository } from '../../../domain/repositories/profile-follow.repository';
import { SocialProfileRepository } from '../../../domain/repositories/social-profile.repository';
import { PublicProfileDto } from '../../dto/profile.dto';
import { CurrentActor } from '../../ports/current-actor.port';

export interface GetPublicProfileInput {
  userId: string;
}

export class GetPublicProfileUseCase {
  constructor(
    private readonly profileRepository: SocialProfileRepository,
    private readonly followRepository: ProfileFollowRepository,
  ) {}

  public async execute(
    _actor: CurrentActor,
    input: GetPublicProfileInput,
  ): Promise<PublicProfileDto> {
    const profile = await this.profileRepository.findByUserId(input.userId);

    if (profile === null) {
      throw new ProfileDomainError(
        ProfileErrorCode.PROFILE_NOT_FOUND,
        `Profile with user id "${input.userId}" not found`,
        { userId: input.userId },
      );
    }

    const [followersCount, followingCount] = await Promise.all([
      this.followRepository.countFollowersOf(input.userId),
      this.followRepository.countFollowingOf(input.userId),
    ]);

    return {
      userId: profile.userId,
      displayName: profile.displayName,
      handle: profile.handle,
      bio: profile.bio,
      avatarUrl: profile.avatarUrl.value,
      followersCount,
      followingCount,
    };
  }
}
