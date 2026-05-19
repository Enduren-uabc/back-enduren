import { Publication } from '../../../domain/entities/publication.entity';
import {
  PublicationDomainError,
  PublicationErrorCode,
} from '../../../domain/errors/publication-domain.error';
import { PublicationRepository } from '../../../domain/repositories/publication.repository';
import { PublicationContent } from '../../../domain/value-objects/publication-content.value-object';
import { PublicationTitle } from '../../../domain/value-objects/publication-title.value-object';
import { CurrentActor } from '../../ports/current-actor.port';
import { DeletePublicationUseCase } from './delete-publication.use-case';

describe('DeletePublicationUseCase', () => {
  let useCase: DeletePublicationUseCase;
  let publicationRepository: PublicationRepository;
  const actor: CurrentActor = { userId: 'user-1' };

  const createPublication = (authorUserId = 'user-1') =>
    Publication.create(
      'publication-1',
      authorUserId,
      PublicationTitle.create('Titulo'),
      PublicationContent.create('Contenido'),
    );

  beforeEach(() => {
    publicationRepository = {
      save: jest.fn(),
      findById: jest.fn(),
      findByIdAndAuthorUserId: jest.fn(),
      delete: jest.fn(() => Promise.resolve()),
      findFeed: jest.fn(),
      countFeed: jest.fn(),
      findFeedByAuthorUserIds: jest.fn(),
      countFeedByAuthorUserIds: jest.fn(),
    };
    useCase = new DeletePublicationUseCase(publicationRepository);
  });

  it('hard-deletes an own publication', async () => {
    (publicationRepository.findById as jest.Mock).mockResolvedValue(
      createPublication(),
    );

    const result = await useCase.execute(actor, {
      publicationId: 'publication-1',
    });

    expect(result).toEqual({ id: 'publication-1', deleted: true });
    expect(publicationRepository.delete).toHaveBeenCalledTimes(1);
  });

  it('rejects deletion from a different user', async () => {
    (publicationRepository.findById as jest.Mock).mockResolvedValue(
      createPublication('user-2'),
    );

    await expect(
      useCase.execute(actor, { publicationId: 'publication-1' }),
    ).rejects.toThrow(PublicationDomainError);

    try {
      await useCase.execute(actor, { publicationId: 'publication-1' });
    } catch (error) {
      expect((error as PublicationDomainError).code).toBe(
        PublicationErrorCode.PUBLICATION_NOT_OWNED,
      );
    }

    expect(publicationRepository.delete).not.toHaveBeenCalled();
  });

  it('rejects deletion when publication does not exist', async () => {
    (publicationRepository.findById as jest.Mock).mockResolvedValue(null);

    await expect(
      useCase.execute(actor, { publicationId: 'missing-publication' }),
    ).rejects.toThrow(PublicationDomainError);

    expect(publicationRepository.delete).not.toHaveBeenCalled();
  });
});
