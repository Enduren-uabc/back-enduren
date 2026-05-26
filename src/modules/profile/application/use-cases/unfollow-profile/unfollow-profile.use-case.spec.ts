import { ProfileFollow } from '../../../domain/entities/profile-follow.entity';
import { SocialProfile } from '../../../domain/entities/social-profile.entity';
import { ProfileDomainError } from '../../../domain/errors/profile-domain.error';
import { ProfileFollowRepository } from '../../../domain/repositories/profile-follow.repository';
import { SocialProfileRepository } from '../../../domain/repositories/social-profile.repository';
import { CurrentActor } from '../../ports/current-actor.port';
import { UnfollowProfileUseCase } from './unfollow-profile.use-case';

describe('UnfollowProfileUseCase', () => {
  let useCase: UnfollowProfileUseCase;
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
      findByHandle: jest.fn(),
      searchByQuery: jest.fn(),
    };
    followRepository = {
      save: jest.fn(),
      findByFollowerAndFollowed: jest.fn(),
      delete: jest.fn(() => Promise.resolve()),
      findFollowersOf: jest.fn(),
      findFollowingOf: jest.fn(),
      countFollowersOf: jest.fn(),
      countFollowingOf: jest.fn(),
    };
    useCase = new UnfollowProfileUseCase(profileRepository, followRepository);
  });

  it('removes an existing follow relationship', async () => {
    (profileRepository.findByUserId as jest.Mock).mockImplementation(
      (userId: string) => Promise.resolve(profile(userId)),
    );
    (followRepository.findByFollowerAndFollowed as jest.Mock).mockResolvedValue(
      ProfileFollow.create('follow-1', 'user-1', 'user-2'),
    );

    const result = await useCase.execute(actor, { targetUserId: 'user-2' });

    expect(result.following).toBe(false);
    expect(followRepository.delete).toHaveBeenCalledTimes(1);
  });

  it('is idempotent when relationship does not exist', async () => {
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
      following: false,
    });
    expect(followRepository.delete).not.toHaveBeenCalled();
  });

  it('rejects unfollow when target profile does not exist', async () => {
    (profileRepository.findByUserId as jest.Mock).mockImplementation(
      (userId: string) =>
        Promise.resolve(userId === 'user-1' ? profile('user-1') : null),
    );

    await expect(
      useCase.execute(actor, { targetUserId: 'missing-user' }),
    ).rejects.toThrow(ProfileDomainError);
  });
});
