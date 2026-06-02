import { SocialProfile } from '../../../domain/entities/social-profile.entity';
import { ProfileDomainError } from '../../../domain/errors/profile-domain.error';
import { SocialProfileRepository } from '../../../domain/repositories/social-profile.repository';
import { CurrentActor } from '../../ports/current-actor.port';
import { SearchProfilesUseCase } from './search-profiles.use-case';

describe('SearchProfilesUseCase', () => {
  let useCase: SearchProfilesUseCase;
  let profileRepository: SocialProfileRepository;
  const actor: CurrentActor = { userId: 'viewer-1' };

  beforeEach(() => {
    profileRepository = {
      save: jest.fn(),
      findByUserId: jest.fn(),
      findByUserIds: jest.fn(),
      findByHandle: jest.fn(),
      searchByQuery: jest.fn(),
    };
    useCase = new SearchProfilesUseCase(profileRepository);
  });

  it('searches profiles by basic query', async () => {
    (profileRepository.searchByQuery as jest.Mock).mockResolvedValue([
      SocialProfile.create('user-1', 'Ana Perez', 'ana_perez'),
    ]);

    const result = await useCase.execute(actor, { query: 'ana' });

    expect(result).toHaveLength(1);
    expect(result[0].handle).toBe('ana_perez');
    expect(profileRepository.searchByQuery).toHaveBeenCalledWith('ana');
  });

  it('returns empty list when no profiles match', async () => {
    (profileRepository.searchByQuery as jest.Mock).mockResolvedValue([]);

    const result = await useCase.execute(actor, { query: 'zzzz' });

    expect(result).toEqual([]);
  });

  it('rejects invalid search query', async () => {
    await expect(useCase.execute(actor, { query: 'a' })).rejects.toThrow(
      ProfileDomainError,
    );

    expect(profileRepository.searchByQuery).not.toHaveBeenCalled();
  });
});
