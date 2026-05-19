import { Publication } from '../../../domain/entities/publication.entity';
import { PublicationComment } from '../../../domain/entities/publication-comment.entity';
import { PublicationDomainError } from '../../../domain/errors/publication-domain.error';
import { PublicationCommentRepository } from '../../../domain/repositories/publication-comment.repository';
import { PublicationRepository } from '../../../domain/repositories/publication.repository';
import { PublicationCommentContent } from '../../../domain/value-objects/publication-comment-content.value-object';
import { PublicationContent } from '../../../domain/value-objects/publication-content.value-object';
import { PublicationTitle } from '../../../domain/value-objects/publication-title.value-object';
import { CurrentActor } from '../../ports/current-actor.port';
import { ListPublicationCommentsUseCase } from './list-publication-comments.use-case';

describe('ListPublicationCommentsUseCase', () => {
  let useCase: ListPublicationCommentsUseCase;
  let publicationRepository: PublicationRepository;
  let commentRepository: PublicationCommentRepository;
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
    commentRepository = {
      save: jest.fn(),
      findById: jest.fn(),
      findByPublicationId: jest.fn(),
      delete: jest.fn(),
    };
    useCase = new ListPublicationCommentsUseCase(
      publicationRepository,
      commentRepository,
    );
  });

  it('lists comments for an existing publication', async () => {
    (publicationRepository.findById as jest.Mock).mockResolvedValue(
      Publication.create(
        'publication-1',
        'author-1',
        PublicationTitle.create('Titulo'),
        PublicationContent.create('Contenido'),
      ),
    );
    (commentRepository.findByPublicationId as jest.Mock).mockResolvedValue([
      PublicationComment.create(
        'comment-1',
        'publication-1',
        'user-2',
        PublicationCommentContent.create('Primer comentario'),
      ),
    ]);

    const result = await useCase.execute(actor, {
      publicationId: 'publication-1',
    });

    expect(result).toHaveLength(1);
    expect(result[0].content).toBe('Primer comentario');
    expect(commentRepository.findByPublicationId).toHaveBeenCalledWith(
      'publication-1',
    );
  });

  it('returns an empty list when no comments exist', async () => {
    (publicationRepository.findById as jest.Mock).mockResolvedValue(
      Publication.create(
        'publication-1',
        'author-1',
        PublicationTitle.create('Titulo'),
        PublicationContent.create('Contenido'),
      ),
    );
    (commentRepository.findByPublicationId as jest.Mock).mockResolvedValue([]);

    const result = await useCase.execute(actor, {
      publicationId: 'publication-1',
    });

    expect(result).toEqual([]);
  });

  it('rejects list for a missing publication', async () => {
    (publicationRepository.findById as jest.Mock).mockResolvedValue(null);

    await expect(
      useCase.execute(actor, { publicationId: 'missing-publication' }),
    ).rejects.toThrow(PublicationDomainError);
  });
});
