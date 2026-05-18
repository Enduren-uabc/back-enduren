import { ProfileFollow } from '../../../domain/entities/profile-follow.entity';
import {
  ProfileDomainError,
  ProfileErrorCode,
} from '../../../domain/errors/profile-domain.error';
import { ProfileFollowRepository } from '../../../domain/repositories/profile-follow.repository';
import { SocialProfileRepository } from '../../../domain/repositories/social-profile.repository';
import { CurrentActor } from '../../ports/current-actor.port';

export const SOCIAL_PROFILE_REPOSITORY_PORT = Symbol(
  'SOCIAL_PROFILE_REPOSITORY_PORT',
);
export const PROFILE_FOLLOW_REPOSITORY_PORT = Symbol(
  'PROFILE_FOLLOW_REPOSITORY_PORT',
);
export const PROFILE_CURRENT_ACTOR_PORT = Symbol('PROFILE_CURRENT_ACTOR_PORT');
export const PROFILE_PUBLICATION_QUERY_PORT = Symbol(
  'PROFILE_PUBLICATION_QUERY_PORT',
);

export interface FollowProfileInput {
  targetUserId: string;
}

export interface FollowProfileOutput {
  followerUserId: string;
  followedUserId: string;
  following: boolean;
}

export class FollowProfileUseCase {
  constructor(
    private readonly profileRepository: SocialProfileRepository,
    private readonly followRepository: ProfileFollowRepository,
  ) {}

  public async execute(
    actor: CurrentActor,
    input: FollowProfileInput,
  ): Promise<FollowProfileOutput> {
    await this.ensureProfileExists(actor.userId);
    await this.ensureProfileExists(input.targetUserId);

    const existingFollow =
      await this.followRepository.findByFollowerAndFollowed(
        actor.userId,
        input.targetUserId,
      );

    if (existingFollow !== null) {
      return {
        followerUserId: actor.userId,
        followedUserId: input.targetUserId,
        following: true,
      };
    }

    const follow = ProfileFollow.create(
      crypto.randomUUID(),
      actor.userId,
      input.targetUserId,
    );

    await this.followRepository.save(follow);

    return {
      followerUserId: follow.followerUserId,
      followedUserId: follow.followedUserId,
      following: true,
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
