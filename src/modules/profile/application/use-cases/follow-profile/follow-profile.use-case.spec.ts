import { ProfileFollow } from '../../../domain/entities/profile-follow.entity';
import { SocialProfile } from '../../../domain/entities/social-profile.entity';
import {
  ProfileDomainError,
  ProfileErrorCode,
} from '../../../domain/errors/profile-domain.error';
import { ProfileFollowRepository } from '../../../domain/repositories/profile-follow.repository';
import { SocialProfileRepository } from '../../../domain/repositories/social-profile.repository';
import { CurrentActor } from '../../ports/current-actor.port';
import { FollowProfileUseCase } from './follow-profile.use-case';

describe('FollowProfileUseCase', () => {
  let useCase: FollowProfileUseCase;
  let profileRepository: SocialProfileRepository;
  let followRepository: ProfileFollowRepository;
  const actor: CurrentActor = { userId: 'user-1' };

  const profile = (userId: string) =>
    SocialProfile.create(userId, `Usuario ${userId}`, `handle_${userId}`);

  beforeEach(() => {
    profileRepository = {
      save: jest.fn(),
      findByUserId: jest.fn(),
      findByUserIds: jest.fn(),
      searchByQuery: jest.fn(),
    };
    followRepository = {
      save: jest.fn((follow: ProfileFollow) => Promise.resolve(follow)),
      findByFollowerAndFollowed: jest.fn(),
      delete: jest.fn(),
      findFollowersOf: jest.fn(),
      findFollowingOf: jest.fn(),
      countFollowersOf: jest.fn(),
      countFollowingOf: jest.fn(),
    };
    useCase = new FollowProfileUseCase(profileRepository, followRepository);
  });

  it('follows another user as current actor', async () => {
    (profileRepository.findByUserId as jest.Mock).mockImplementation(
      (userId: string) => Promise.resolve(profile(userId)),
    );
    (followRepository.findByFollowerAndFollowed as jest.Mock).mockResolvedValue(
      null,
    );

    const result = await useCase.execute(actor, { targetUserId: 'user-2' });

    expect(result).toEqual({
      followerUserId: 'user-1',
      followedUserId: 'user-2',
      following: true,
    });
    expect(followRepository.save).toHaveBeenCalledTimes(1);
  });

  it('is idempotent when follow already exists', async () => {
    (profileRepository.findByUserId as jest.Mock).mockImplementation(
      (userId: string) => Promise.resolve(profile(userId)),
    );
    (followRepository.findByFollowerAndFollowed as jest.Mock).mockResolvedValue(
      ProfileFollow.create('follow-1', 'user-1', 'user-2'),
    );

    const result = await useCase.execute(actor, { targetUserId: 'user-2' });

    expect(result.following).toBe(true);
    expect(followRepository.save).not.toHaveBeenCalled();
  });

  it('rejects self-follow', async () => {
    (profileRepository.findByUserId as jest.Mock).mockImplementation(
      (userId: string) => Promise.resolve(profile(userId)),
    );
    (followRepository.findByFollowerAndFollowed as jest.Mock).mockResolvedValue(
      null,
    );

    await expect(
      useCase.execute(actor, { targetUserId: 'user-1' }),
    ).rejects.toThrow(ProfileDomainError);

    try {
      await useCase.execute(actor, { targetUserId: 'user-1' });
    } catch (error) {
      expect((error as ProfileDomainError).code).toBe(
        ProfileErrorCode.PROFILE_SELF_FOLLOW_NOT_ALLOWED,
      );
    }

    expect(followRepository.save).not.toHaveBeenCalled();
  });

  it('rejects follow when target profile does not exist', async () => {
    (profileRepository.findByUserId as jest.Mock).mockImplementation(
      (userId: string) =>
        Promise.resolve(userId === 'user-1' ? profile('user-1') : null),
    );

    await expect(
      useCase.execute(actor, { targetUserId: 'missing-user' }),
    ).rejects.toThrow(ProfileDomainError);
  });
});
