import { SocialProfile } from '../../../domain/entities/social-profile.entity';
import {
  ProfileDomainError,
  ProfileErrorCode,
} from '../../../domain/errors/profile-domain.error';
import { SocialProfileRepository } from '../../../domain/repositories/social-profile.repository';
import { CurrentActor } from '../../ports/current-actor.port';
import { UpdateOwnProfileUseCase } from './update-own-profile.use-case';
import { UserRepository } from '../../../../users/domain/repositories/user.repository';

describe('UpdateOwnProfileUseCase', () => {
  let useCase: UpdateOwnProfileUseCase;
  let profileRepository: SocialProfileRepository;
  let userRepository: UserRepository;
  const actor: CurrentActor = { userId: 'user-1' };

  beforeEach(() => {
    profileRepository = {
      save: jest.fn((profile: SocialProfile) => Promise.resolve(profile)),
      findByUserId: jest.fn(),
      findByUserIds: jest.fn(),
      findByHandle: jest.fn(),
      searchByQuery: jest.fn(),
    };
    userRepository = {
      save: jest.fn((user) => Promise.resolve(user)),
      findById: jest.fn(),
      findByEmail: jest.fn(),
      findByUsername: jest.fn(),
      existsByEmail: jest.fn(),
      existsByUsername: jest.fn(),
      findByTrainerCode: jest.fn(),
      findBySocialId: jest.fn(),
    };
    useCase = new UpdateOwnProfileUseCase(profileRepository, userRepository);
  });

  it('updates only the current actor profile bio and avatar URL', async () => {
    (profileRepository.findByUserId as jest.Mock).mockResolvedValue(
      SocialProfile.create('user-1', 'Usuario Uno', 'usuario_uno'),
    );

    const result = await useCase.execute(actor, {
      bio: 'Nueva bio',
      avatarUrl: 'https://cdn.example.com/avatar.jpg',
    });

    expect(result.userId).toBe('user-1');
    expect(result.bio).toBe('Nueva bio');
    expect(result.avatarUrl).toBe('https://cdn.example.com/avatar.jpg');
    expect(profileRepository.save).toHaveBeenCalledTimes(1);
  });

  it('rejects invalid avatar URL', async () => {
    (profileRepository.findByUserId as jest.Mock).mockResolvedValue(
      SocialProfile.create('user-1', 'Usuario Uno', 'usuario_uno'),
    );

    await expect(
      useCase.execute(actor, { avatarUrl: 'invalid-url' }),
    ).rejects.toThrow(ProfileDomainError);

    try {
      await useCase.execute(actor, { avatarUrl: 'invalid-url' });
    } catch (error) {
      expect((error as ProfileDomainError).code).toBe(
        ProfileErrorCode.PROFILE_AVATAR_URL_INVALID,
      );
    }

    expect(profileRepository.save).not.toHaveBeenCalled();
  });

  it('rejects empty update payload', async () => {
    (profileRepository.findByUserId as jest.Mock).mockResolvedValue(
      SocialProfile.create('user-1', 'Usuario Uno', 'usuario_uno'),
    );

    await expect(useCase.execute(actor, {})).rejects.toThrow(
      ProfileDomainError,
    );
  });
});
