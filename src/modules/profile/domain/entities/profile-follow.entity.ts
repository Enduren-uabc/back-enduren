import {
  ProfileDomainError,
  ProfileErrorCode,
} from '../errors/profile-domain.error';

export class ProfileFollow {
  public readonly id: string;
  public readonly followerUserId: string;
  public readonly followedUserId: string;
  public readonly createdAt: Date;

  private constructor(
    id: string,
    followerUserId: string,
    followedUserId: string,
    createdAt: Date,
  ) {
    this.id = id;
    this.followerUserId = followerUserId;
    this.followedUserId = followedUserId;
    this.createdAt = createdAt;
  }

  public static create(
    id: string,
    followerUserId: string,
    followedUserId: string,
  ): ProfileFollow {
    if (followerUserId === followedUserId) {
      throw new ProfileDomainError(
        ProfileErrorCode.PROFILE_SELF_FOLLOW_NOT_ALLOWED,
        'A user cannot follow themselves',
        { followerUserId, followedUserId },
      );
    }

    return new ProfileFollow(id, followerUserId, followedUserId, new Date());
  }

  public static reconstitute(
    id: string,
    followerUserId: string,
    followedUserId: string,
    createdAt: Date,
  ): ProfileFollow {
    return new ProfileFollow(id, followerUserId, followedUserId, createdAt);
  }
}
