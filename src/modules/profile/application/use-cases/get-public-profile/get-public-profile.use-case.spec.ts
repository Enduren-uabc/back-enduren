import { SocialProfile } from '../../../domain/entities/social-profile.entity';
import { ProfileDomainError } from '../../../domain/errors/profile-domain.error';
import { ProfileFollowRepository } from '../../../domain/repositories/profile-follow.repository';
import { SocialProfileRepository } from '../../../domain/repositories/social-profile.repository';
import { CurrentActor } from '../../ports/current-actor.port';
import { GetPublicProfileUseCase } from './get-public-profile.use-case';

describe('GetPublicProfileUseCase', () => {
  let useCase: GetPublicProfileUseCase;
  let profileRepository: SocialProfileRepository;
  let followRepository: ProfileFollowRepository;
  const actor: CurrentActor = { userId: 'viewer-1' };

  beforeEach(() => {
    profileRepository = {
      save: jest.fn(),
      findByUserId: jest.fn(),
      findByUserIds: jest.fn(),
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
    useCase = new GetPublicProfileUseCase(profileRepository, followRepository);
  });

  it('returns public profile with follow counters', async () => {
    (profileRepository.findByUserId as jest.Mock).mockResolvedValue(
      SocialProfile.create('user-1', 'Usuario Uno', 'usuario_uno'),
    );
    (followRepository.countFollowersOf as jest.Mock).mockResolvedValue(3);
    (followRepository.countFollowingOf as jest.Mock).mockResolvedValue(5);

    const result = await useCase.execute(actor, { userId: 'user-1' });

    expect(result.userId).toBe('user-1');
    expect(result.followersCount).toBe(3);
    expect(result.followingCount).toBe(5);
  });

  it('rejects missing public profile', async () => {
    (profileRepository.findByUserId as jest.Mock).mockResolvedValue(null);

    await expect(
      useCase.execute(actor, { userId: 'missing-user' }),
    ).rejects.toThrow(ProfileDomainError);
  });
});
