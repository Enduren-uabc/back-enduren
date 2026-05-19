import { ProfileFollow } from './entities/profile-follow.entity';
import {
  ProfileDomainError,
  ProfileErrorCode,
} from './errors/profile-domain.error';

describe('ProfileFollow domain', () => {
  it('creates a pure social follow relationship', () => {
    const follow = ProfileFollow.create('follow-1', 'user-1', 'user-2');

    expect(follow.id).toBe('follow-1');
    expect(follow.followerUserId).toBe('user-1');
    expect(follow.followedUserId).toBe('user-2');
    expect(follow.createdAt).toBeInstanceOf(Date);
  });

  it('rejects self-follow', () => {
    expect(() => ProfileFollow.create('follow-1', 'user-1', 'user-1')).toThrow(
      ProfileDomainError,
    );

    try {
      ProfileFollow.create('follow-1', 'user-1', 'user-1');
    } catch (error) {
      expect((error as ProfileDomainError).code).toBe(
        ProfileErrorCode.PROFILE_SELF_FOLLOW_NOT_ALLOWED,
      );
    }
  });
});
