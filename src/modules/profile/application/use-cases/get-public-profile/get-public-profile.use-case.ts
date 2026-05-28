import { Inject } from '@nestjs/common';
import { SocialProfile } from '../../../domain/entities/social-profile.entity';
import { ProfileFollowRepository } from '../../../domain/repositories/profile-follow.repository';
import { SocialProfileRepository } from '../../../domain/repositories/social-profile.repository';
import { PublicProfileDto } from '../../dto/profile.dto';
import { CurrentActor } from '../../ports/current-actor.port';
import {
  USER_REPOSITORY_PORT,
  UserRepository,
} from '../../../../users/domain/repositories/user.repository';

export interface GetPublicProfileInput {
  userId: string;
}

export class GetPublicProfileUseCase {
  constructor(
    private readonly profileRepository: SocialProfileRepository,
    private readonly followRepository: ProfileFollowRepository,
    @Inject(USER_REPOSITORY_PORT)
    private readonly userRepository: UserRepository,
  ) {}

  public async execute(
    _actor: CurrentActor,
    input: GetPublicProfileInput,
  ): Promise<PublicProfileDto> {
    let profile = await this.profileRepository.findByUserId(input.userId);

    if (profile === null) {
      const user = await this.userRepository.findById(input.userId);
      if (!user) {
        throw new Error(`User with id "${input.userId}" not found`);
      }
      profile = SocialProfile.create(
        user.id,
        user.username,
        `@${user.username}`,
      );
      await this.profileRepository.save(profile);
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
