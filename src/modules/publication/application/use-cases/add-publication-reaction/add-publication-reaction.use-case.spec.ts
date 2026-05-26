import { Publication } from '../../../domain/entities/publication.entity';
import { PublicationReaction } from '../../../domain/entities/publication-reaction.entity';
import { PublicationDomainError } from '../../../domain/errors/publication-domain.error';
import { PublicationReactionRepository } from '../../../domain/repositories/publication-reaction.repository';
import { PublicationRepository } from '../../../domain/repositories/publication.repository';
import { PublicationContent } from '../../../domain/value-objects/publication-content.value-object';
import { PublicationTitle } from '../../../domain/value-objects/publication-title.value-object';
import { CurrentActor } from '../../ports/current-actor.port';
import { AddPublicationReactionUseCase } from './add-publication-reaction.use-case';

describe('AddPublicationReactionUseCase', () => {
  let useCase: AddPublicationReactionUseCase;
  let publicationRepository: PublicationRepository;
  let reactionRepository: PublicationReactionRepository;
  const actor: CurrentActor = { userId: 'user-1' };

  const publication = Publication.create(
    'publication-1',
    'author-1',
    PublicationTitle.create('Titulo'),
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
    reactionRepository = {
      save: jest.fn((r) => Promise.resolve(r)),
      findByPublicationIdAndAuthorUserId: jest.fn(),
      delete: jest.fn(),
      countByPublicationIds: jest.fn(),
      findRecentAuthorUserIdsByPublicationIds: jest.fn(),
    };
    useCase = new AddPublicationReactionUseCase(
      publicationRepository,
      reactionRepository,
    );
  });

  it('registers a reaction for the current actor', async () => {
    (publicationRepository.findById as jest.Mock).mockResolvedValue(
      publication,
    );
    (
      reactionRepository.findByPublicationIdAndAuthorUserId as jest.Mock
    ).mockResolvedValue(null);

    const result = await useCase.execute(actor, {
      publicationId: 'publication-1',
    });

    expect(result.publicationId).toBe('publication-1');
    expect(result.authorUserId).toBe('user-1');
    expect(reactionRepository.save).toHaveBeenCalledTimes(1);
  });

  it('is idempotent when the actor already reacted', async () => {
    const existingReaction = PublicationReaction.create(
      'reaction-1',
      'publication-1',
      'user-1',
    );
    (publicationRepository.findById as jest.Mock).mockResolvedValue(
      publication,
    );
    (
      reactionRepository.findByPublicationIdAndAuthorUserId as jest.Mock
    ).mockResolvedValue(existingReaction);

    const result = await useCase.execute(actor, {
      publicationId: 'publication-1',
    });

    expect(result.id).toBe('reaction-1');
    expect(reactionRepository.save).not.toHaveBeenCalled();
  });

  it('rejects reaction for a missing publication', async () => {
    (publicationRepository.findById as jest.Mock).mockResolvedValue(null);

    await expect(
      useCase.execute(actor, { publicationId: 'missing-publication' }),
    ).rejects.toThrow(PublicationDomainError);

    expect(reactionRepository.save).not.toHaveBeenCalled();
  });
});
