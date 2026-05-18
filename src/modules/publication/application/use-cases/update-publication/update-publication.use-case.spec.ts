import { Publication } from '../../../domain/entities/publication.entity';
import {
  PublicationDomainError,
  PublicationErrorCode,
} from '../../../domain/errors/publication-domain.error';
import { PublicationRepository } from '../../../domain/repositories/publication.repository';
import { PublicationContent } from '../../../domain/value-objects/publication-content.value-object';
import { PublicationTitle } from '../../../domain/value-objects/publication-title.value-object';
import { CurrentActor } from '../../ports/current-actor.port';
import { UpdatePublicationUseCase } from './update-publication.use-case';

describe('UpdatePublicationUseCase', () => {
  let useCase: UpdatePublicationUseCase;
  let publicationRepository: PublicationRepository;
  const actor: CurrentActor = { userId: 'user-1' };

  const createPublication = (authorUserId = 'user-1') =>
    Publication.create(
      'publication-1',
      authorUserId,
      PublicationTitle.create('Titulo original'),
      PublicationContent.create('Contenido original'),
    );

  beforeEach(() => {
    publicationRepository = {
      save: jest.fn((publication: Publication) => Promise.resolve(publication)),
      findById: jest.fn(),
      findByIdAndAuthorUserId: jest.fn(),
      delete: jest.fn(),
      findFeed: jest.fn(),
      countFeed: jest.fn(),
      findFeedByAuthorUserIds: jest.fn(),
      countFeedByAuthorUserIds: jest.fn(),
    };
    useCase = new UpdatePublicationUseCase(publicationRepository);
  });

  it('updates an own publication title and content', async () => {
    (publicationRepository.findById as jest.Mock).mockResolvedValue(
      createPublication(),
    );

    const result = await useCase.execute(actor, {
      publicationId: 'publication-1',
      title: 'Titulo nuevo',
      content: 'Contenido nuevo',
    });

    expect(result.id).toBe('publication-1');
    expect(result.authorUserId).toBe('user-1');
    expect(result.title).toBe('Titulo nuevo');
    expect(result.content).toBe('Contenido nuevo');
    expect(publicationRepository.save).toHaveBeenCalledTimes(1);
  });

  it('updates only one provided field', async () => {
    (publicationRepository.findById as jest.Mock).mockResolvedValue(
      createPublication(),
    );

    const result = await useCase.execute(actor, {
      publicationId: 'publication-1',
      title: 'Solo titulo',
    });

    expect(result.title).toBe('Solo titulo');
    expect(result.content).toBe('Contenido original');
  });

  it('rejects update from a different user', async () => {
    (publicationRepository.findById as jest.Mock).mockResolvedValue(
      createPublication('user-2'),
    );

    await expect(
      useCase.execute(actor, {
        publicationId: 'publication-1',
        title: 'Intento no autorizado',
      }),
    ).rejects.toThrow(PublicationDomainError);

    try {
      await useCase.execute(actor, {
        publicationId: 'publication-1',
        title: 'Intento no autorizado',
      });
    } catch (error) {
      expect((error as PublicationDomainError).code).toBe(
        PublicationErrorCode.PUBLICATION_NOT_OWNED,
      );
    }

    expect(publicationRepository.save).not.toHaveBeenCalled();
  });

  it('rejects empty update payload', async () => {
    (publicationRepository.findById as jest.Mock).mockResolvedValue(
      createPublication(),
    );

    await expect(
      useCase.execute(actor, { publicationId: 'publication-1' }),
    ).rejects.toThrow(PublicationDomainError);

    expect(publicationRepository.save).not.toHaveBeenCalled();
  });

  it('rejects update when publication does not exist', async () => {
    (publicationRepository.findById as jest.Mock).mockResolvedValue(null);

    await expect(
      useCase.execute(actor, {
        publicationId: 'missing-publication',
        title: 'Titulo',
      }),
    ).rejects.toThrow(PublicationDomainError);

    expect(publicationRepository.save).not.toHaveBeenCalled();
  });
});
