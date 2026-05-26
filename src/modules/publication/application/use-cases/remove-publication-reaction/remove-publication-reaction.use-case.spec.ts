import { Publication } from '../../../domain/entities/publication.entity';
import { PublicationReaction } from '../../../domain/entities/publication-reaction.entity';
import { PublicationDomainError } from '../../../domain/errors/publication-domain.error';
import { PublicationReactionRepository } from '../../../domain/repositories/publication-reaction.repository';
import { PublicationRepository } from '../../../domain/repositories/publication.repository';
import { PublicationContent } from '../../../domain/value-objects/publication-content.value-object';
import { PublicationTitle } from '../../../domain/value-objects/publication-title.value-object';
import { CurrentActor } from '../../ports/current-actor.port';
import { RemovePublicationReactionUseCase } from './remove-publication-reaction.use-case';

describe('RemovePublicationReactionUseCase', () => {
  let useCase: RemovePublicationReactionUseCase;
  let publicationRepository: PublicationRepository;
  let reactionRepository: PublicationReactionRepository;
  const actor: CurrentActor = { userId: 'user-1' };

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
    reactionRepository = {
      save: jest.fn((r) => Promise.resolve(r)),
      findByPublicationIdAndAuthorUserId: jest.fn(),
      delete: jest.fn(),
      countByPublicationIds: jest.fn(),
      findRecentAuthorUserIdsByPublicationIds: jest.fn(),
    };
    useCase = new RemovePublicationReactionUseCase(
      publicationRepository,
      reactionRepository,
    );
  });

  it('removes the current actor reaction', async () => {
    (publicationRepository.findById as jest.Mock).mockResolvedValue(
      Publication.create(
        'publication-1',
        'author-1',
        PublicationTitle.create('Titulo'),
        PublicationContent.create('Contenido'),
      ),
    );
    (
      reactionRepository.findByPublicationIdAndAuthorUserId as jest.Mock
    ).mockResolvedValue(
      PublicationReaction.create('reaction-1', 'publication-1', 'user-1'),
    );

    const result = await useCase.execute(actor, {
      publicationId: 'publication-1',
    });

    expect(result).toEqual({ publicationId: 'publication-1', deleted: true });
    expect(reactionRepository.delete).toHaveBeenCalledTimes(1);
  });

  it('is idempotent when no current actor reaction exists', async () => {
    (publicationRepository.findById as jest.Mock).mockResolvedValue(
      Publication.create(
        'publication-1',
        'author-1',
        PublicationTitle.create('Titulo'),
        PublicationContent.create('Contenido'),
      ),
    );
    (
      reactionRepository.findByPublicationIdAndAuthorUserId as jest.Mock
    ).mockResolvedValue(null);

    const result = await useCase.execute(actor, {
      publicationId: 'publication-1',
    });

    expect(result).toEqual({ publicationId: 'publication-1', deleted: false });
    expect(reactionRepository.delete).not.toHaveBeenCalled();
  });

  it('rejects removal for a missing publication', async () => {
    (publicationRepository.findById as jest.Mock).mockResolvedValue(null);

    await expect(
      useCase.execute(actor, { publicationId: 'missing-publication' }),
    ).rejects.toThrow(PublicationDomainError);
  });
});
