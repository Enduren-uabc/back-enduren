import { ProfileFollow } from '../../../domain/entities/profile-follow.entity';
import { SocialProfile } from '../../../domain/entities/social-profile.entity';
import { ProfileFollowRepository } from '../../../domain/repositories/profile-follow.repository';
import { SocialProfileRepository } from '../../../domain/repositories/social-profile.repository';
import { CurrentActor } from '../../ports/current-actor.port';
import { ListProfileFollowingUseCase } from './list-profile-following.use-case';

describe('ListProfileFollowingUseCase', () => {
  let useCase: ListProfileFollowingUseCase;
  let profileRepository: SocialProfileRepository;
  let followRepository: ProfileFollowRepository;
  const actor: CurrentActor = { userId: 'viewer-1' };

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
      delete: jest.fn(),
      findFollowersOf: jest.fn(),
      findFollowingOf: jest.fn(),
      countFollowersOf: jest.fn(),
      countFollowingOf: jest.fn(),
    };
    useCase = new ListProfileFollowingUseCase(
      profileRepository,
      followRepository,
    );
  });

  it('returns followed profiles', async () => {
    (profileRepository.findByUserId as jest.Mock).mockResolvedValue(
      SocialProfile.create('user-1', 'Usuario Uno', 'usuario_uno'),
    );
    (followRepository.findFollowingOf as jest.Mock).mockResolvedValue([
      ProfileFollow.create('follow-1', 'user-1', 'followed-1'),
    ]);
    (profileRepository.findByUserIds as jest.Mock).mockResolvedValue([
      SocialProfile.create('followed-1', 'Followed Uno', 'followed_uno'),
    ]);

    const result = await useCase.execute(actor, { userId: 'user-1' });

    expect(result).toHaveLength(1);
    expect(result[0].userId).toBe('followed-1');
  });
});
