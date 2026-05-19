import {
  ProfileDomainError,
  ProfileErrorCode,
} from '../../../domain/errors/profile-domain.error';
import { ProfileFollowRepository } from '../../../domain/repositories/profile-follow.repository';
import { SocialProfileRepository } from '../../../domain/repositories/social-profile.repository';
import { CurrentActor } from '../../ports/current-actor.port';

export interface UnfollowProfileInput {
  targetUserId: string;
}

export interface UnfollowProfileOutput {
  followerUserId: string;
  followedUserId: string;
  following: boolean;
}

export class UnfollowProfileUseCase {
  constructor(
    private readonly profileRepository: SocialProfileRepository,
    private readonly followRepository: ProfileFollowRepository,
  ) {}

  public async execute(
    actor: CurrentActor,
    input: UnfollowProfileInput,
  ): Promise<UnfollowProfileOutput> {
    await this.ensureProfileExists(actor.userId);
    await this.ensureProfileExists(input.targetUserId);

    const follow = await this.followRepository.findByFollowerAndFollowed(
      actor.userId,
      input.targetUserId,
    );

    if (follow !== null) {
      await this.followRepository.delete(follow);
    }

    return {
      followerUserId: actor.userId,
      followedUserId: input.targetUserId,
      following: false,
    };
  }

  private async ensureProfileExists(userId: string): Promise<void> {
    const profile = await this.profileRepository.findByUserId(userId);

    if (profile === null) {
      throw new ProfileDomainError(
        ProfileErrorCode.PROFILE_NOT_FOUND,
        `Profile with user id "${userId}" not found`,
        { userId },
      );
    }
  }
}
