import { SocialProfile } from '../../../domain/entities/social-profile.entity';
import { ProfileDomainError } from '../../../domain/errors/profile-domain.error';
import { SocialProfileRepository } from '../../../domain/repositories/social-profile.repository';
import { CurrentActor } from '../../ports/current-actor.port';
import { ProfilePublicationQueryPort } from '../../ports/profile-publication-query.port';
import { ListProfilePublicationsUseCase } from './list-profile-publications.use-case';

describe('ListProfilePublicationsUseCase', () => {
  let useCase: ListProfilePublicationsUseCase;
  let profileRepository: SocialProfileRepository;
  let publicationQuery: ProfilePublicationQueryPort;
  const actor: CurrentActor = { userId: 'viewer-1' };

  beforeEach(() => {
    profileRepository = {
      save: jest.fn(),
      findByUserId: jest.fn(),
      findByUserIds: jest.fn(),
      searchByQuery: jest.fn(),
    };
    publicationQuery = {
      findByAuthorUserId: jest.fn(),
    };
    useCase = new ListProfilePublicationsUseCase(
      profileRepository,
      publicationQuery,
    );
  });

  it('delegates profile publication reads through query port', async () => {
    (profileRepository.findByUserId as jest.Mock).mockResolvedValue(
      SocialProfile.create('user-1', 'Usuario Uno', 'usuario_uno'),
    );
    (publicationQuery.findByAuthorUserId as jest.Mock).mockResolvedValue({
      items: [
        {
          id: 'publication-1',
          authorUserId: 'user-1',
          title: 'Titulo',
          content: 'Contenido',
          mediaUrls: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
      limit: 10,
      offset: 0,
      total: 1,
      hasMore: false,
    });

    const result = await useCase.execute(actor, {
      userId: 'user-1',
      limit: 10,
      offset: 0,
    });

    expect(result.items).toHaveLength(1);
    expect(publicationQuery.findByAuthorUserId).toHaveBeenCalledWith({
      authorUserId: 'user-1',
      limit: 10,
      offset: 0,
    });
  });

  it('uses default pagination', async () => {
    (profileRepository.findByUserId as jest.Mock).mockResolvedValue(
      SocialProfile.create('user-1', 'Usuario Uno', 'usuario_uno'),
    );
    (publicationQuery.findByAuthorUserId as jest.Mock).mockResolvedValue({
      items: [],
      limit: 20,
      offset: 0,
      total: 0,
      hasMore: false,
    });

    await useCase.execute(actor, { userId: 'user-1' });

    expect(publicationQuery.findByAuthorUserId).toHaveBeenCalledWith({
      authorUserId: 'user-1',
      limit: 20,
      offset: 0,
    });
  });

  it('rejects invalid pagination', async () => {
    (profileRepository.findByUserId as jest.Mock).mockResolvedValue(
      SocialProfile.create('user-1', 'Usuario Uno', 'usuario_uno'),
    );

    await expect(
      useCase.execute(actor, { userId: 'user-1', limit: 0, offset: 0 }),
    ).rejects.toThrow(ProfileDomainError);

    expect(publicationQuery.findByAuthorUserId).not.toHaveBeenCalled();
  });

  it('rejects missing profile before querying publications', async () => {
    (profileRepository.findByUserId as jest.Mock).mockResolvedValue(null);

    await expect(
      useCase.execute(actor, { userId: 'missing-user' }),
    ).rejects.toThrow(ProfileDomainError);

    expect(publicationQuery.findByAuthorUserId).not.toHaveBeenCalled();
  });
});
