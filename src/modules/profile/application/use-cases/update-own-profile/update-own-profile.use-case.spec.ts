import { SocialProfile } from '../../../domain/entities/social-profile.entity';
import {
  ProfileDomainError,
  ProfileErrorCode,
} from '../../../domain/errors/profile-domain.error';
import { SocialProfileRepository } from '../../../domain/repositories/social-profile.repository';
import { CurrentActor } from '../../ports/current-actor.port';
import { UpdateOwnProfileUseCase } from './update-own-profile.use-case';

describe('UpdateOwnProfileUseCase', () => {
  let useCase: UpdateOwnProfileUseCase;
  let profileRepository: SocialProfileRepository;
  const actor: CurrentActor = { userId: 'user-1' };

  beforeEach(() => {
    profileRepository = {
      save: jest.fn((profile: SocialProfile) => Promise.resolve(profile)),
      findByUserId: jest.fn(),
      findByUserIds: jest.fn(),
      searchByQuery: jest.fn(),
    };
    useCase = new UpdateOwnProfileUseCase(profileRepository);
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
