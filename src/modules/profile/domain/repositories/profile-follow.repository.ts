import { ProfileFollow } from '../entities/profile-follow.entity';

export interface ProfileFollowRepository {
  save(follow: ProfileFollow): Promise<ProfileFollow>;
  findByFollowerAndFollowed(
    followerUserId: string,
    followedUserId: string,
  ): Promise<ProfileFollow | null>;
  delete(follow: ProfileFollow): Promise<void>;
  findFollowersOf(userId: string): Promise<ProfileFollow[]>;
  findFollowingOf(userId: string): Promise<ProfileFollow[]>;
  countFollowersOf(userId: string): Promise<number>;
  countFollowingOf(userId: string): Promise<number>;
}
