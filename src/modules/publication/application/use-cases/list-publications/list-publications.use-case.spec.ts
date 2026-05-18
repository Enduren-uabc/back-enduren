import { Publication } from '../../../domain/entities/publication.entity';
import { PublicationDomainError } from '../../../domain/errors/publication-domain.error';
import { PublicationRepository } from '../../../domain/repositories/publication.repository';
import { PublicationContent } from '../../../domain/value-objects/publication-content.value-object';
import { PublicationTitle } from '../../../domain/value-objects/publication-title.value-object';
import { CurrentActor } from '../../ports/current-actor.port';
import { FollowedUsersQueryPort } from '../../ports/followed-users-query.port';
import { ListPublicationsUseCase } from './list-publications.use-case';

describe('ListPublicationsUseCase', () => {
  let useCase: ListPublicationsUseCase;
  let publicationRepository: PublicationRepository;
  let followedUsersQuery: FollowedUsersQueryPort;
  const actor: CurrentActor = { userId: 'user-1' };

  const createPublication = (
    id: string,
    title: string,
    authorUserId = 'author-1',
  ) =>
    Publication.create(
      id,
      authorUserId,
      PublicationTitle.create(title),
      PublicationContent.create('Contenido'),
    );

  beforeEach(() => {
    publicationRepository = {
      save: jest.fn(),
      findById: jest.fn(),
      findByIdAndAuthorUserId: jest.fn(),
      delete: jest.fn(),
      findFeed: jest.fn(),
      countFeed: jest.fn(),
      findFeedByAuthorUserIds: jest.fn(),
      countFeedByAuthorUserIds: jest.fn(),
    };
    followedUsersQuery = {
      findFollowedUserIds: jest.fn(),
    };
    useCase = new ListPublicationsUseCase(
      publicationRepository,
      followedUsersQuery,
    );
  });

  it('returns feed page with pagination metadata', async () => {
    (publicationRepository.findFeed as jest.Mock).mockResolvedValue([
      createPublication('publication-2', 'Mas reciente'),
      createPublication('publication-1', 'Anterior'),
    ]);
    (publicationRepository.countFeed as jest.Mock).mockResolvedValue(3);

    const result = await useCase.execute(actor, { limit: 2, offset: 0 });

    expect(result.items).toHaveLength(2);
    expect(result.items[0].id).toBe('publication-2');
    expect(result.limit).toBe(2);
    expect(result.offset).toBe(0);
    expect(result.total).toBe(3);
    expect(result.hasMore).toBe(true);
    expect(publicationRepository.findFeed).toHaveBeenCalledWith({
      limit: 2,
      offset: 0,
    });
  });

  it('uses default pagination when not provided', async () => {
    (publicationRepository.findFeed as jest.Mock).mockResolvedValue([]);
    (publicationRepository.countFeed as jest.Mock).mockResolvedValue(0);

    const result = await useCase.execute(actor, {});

    expect(result.limit).toBe(20);
    expect(result.offset).toBe(0);
    expect(result.hasMore).toBe(false);
  });

  it('rejects invalid pagination', async () => {
    await expect(
      useCase.execute(actor, { limit: 0, offset: 0 }),
    ).rejects.toThrow(PublicationDomainError);

    expect(publicationRepository.findFeed).not.toHaveBeenCalled();
  });

  it('returns only followed users publications when filter is following', async () => {
    (followedUsersQuery.findFollowedUserIds as jest.Mock).mockResolvedValue([
      'followed-1',
      'followed-2',
    ]);
    (
      publicationRepository.findFeedByAuthorUserIds as jest.Mock
    ).mockResolvedValue([
      createPublication('publication-1', 'Seguido', 'followed-1'),
    ]);
    (
      publicationRepository.countFeedByAuthorUserIds as jest.Mock
    ).mockResolvedValue(1);

    const result = await useCase.execute(actor, {
      limit: 10,
      offset: 0,
      filter: 'following',
    });

    expect(result.items).toHaveLength(1);
    expect(result.items[0].authorUserId).toBe('followed-1');
    expect(publicationRepository.findFeedByAuthorUserIds).toHaveBeenCalledWith({
      authorUserIds: ['followed-1', 'followed-2'],
      limit: 10,
      offset: 0,
    });
    expect(publicationRepository.findFeed).not.toHaveBeenCalled();
  });

  it('does not query publications when actor follows nobody', async () => {
    (followedUsersQuery.findFollowedUserIds as jest.Mock).mockResolvedValue([]);

    const result = await useCase.execute(actor, { filter: 'following' });

    expect(result.items).toEqual([]);
    expect(result.total).toBe(0);
    expect(
      publicationRepository.findFeedByAuthorUserIds,
    ).not.toHaveBeenCalled();
  });
});
