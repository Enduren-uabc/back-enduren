import { Publication } from '../../../domain/entities/publication.entity';
import {
  PublicationDomainError,
  PublicationErrorCode,
} from '../../../domain/errors/publication-domain.error';
import { PublicationRepository } from '../../../domain/repositories/publication.repository';
import { CurrentActor } from '../../ports/current-actor.port';
import { CreatePublicationUseCase } from './create-publication.use-case';

describe('CreatePublicationUseCase', () => {
  let useCase: CreatePublicationUseCase;
  let publicationRepository: PublicationRepository;
  const actor: CurrentActor = { userId: 'user-1' };

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
    useCase = new CreatePublicationUseCase(publicationRepository);
  });

  it('creates RF-SOC-POST-01 publication using current actor as author', async () => {
    const result = await useCase.execute(actor, {
      title: 'Mi progreso',
      content: 'Primera publicacion social.',
    });

    expect(result.id).toBeDefined();
    expect(result.authorUserId).toBe('user-1');
    expect(result.title).toBe('Mi progreso');
    expect(result.content).toBe('Primera publicacion social.');
    expect(publicationRepository.save).toHaveBeenCalledTimes(1);
  });

  it('does not require routine or workout session data', async () => {
    const result = await useCase.execute(actor, {
      title: 'Publicacion libre',
      content: 'Contenido sin vinculo fitness explicito.',
    });

    expect(result.authorUserId).toBe(actor.userId);
    expect(result.title).toBe('Publicacion libre');
  });

  it('rejects invalid content before persistence', async () => {
    await expect(
      useCase.execute(actor, {
        title: 'Titulo',
        content: '',
      }),
    ).rejects.toThrow(PublicationDomainError);

    try {
      await useCase.execute(actor, {
        title: 'Titulo',
        content: '',
      });
    } catch (error) {
      expect((error as PublicationDomainError).code).toBe(
        PublicationErrorCode.PUBLICATION_CONTENT_REQUIRED,
      );
    }

    expect(publicationRepository.save).not.toHaveBeenCalled();
  });
});
