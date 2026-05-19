import { Publication } from '../../../domain/entities/publication.entity';
import { PublicationComment } from '../../../domain/entities/publication-comment.entity';
import {
  PublicationDomainError,
  PublicationErrorCode,
} from '../../../domain/errors/publication-domain.error';
import { PublicationCommentRepository } from '../../../domain/repositories/publication-comment.repository';
import { PublicationRepository } from '../../../domain/repositories/publication.repository';
import { PublicationCommentContent } from '../../../domain/value-objects/publication-comment-content.value-object';
import { PublicationContent } from '../../../domain/value-objects/publication-content.value-object';
import { PublicationTitle } from '../../../domain/value-objects/publication-title.value-object';
import { CurrentActor } from '../../ports/current-actor.port';
import { CreatePublicationCommentUseCase } from './create-publication-comment.use-case';

describe('CreatePublicationCommentUseCase', () => {
  let useCase: CreatePublicationCommentUseCase;
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
      save: jest.fn((comment: PublicationComment) => Promise.resolve(comment)),
      findById: jest.fn(),
      findByPublicationId: jest.fn(),
      delete: jest.fn(),
    };
    useCase = new CreatePublicationCommentUseCase(
      publicationRepository,
      commentRepository,
    );
  });

  it('creates a comment for the current actor', async () => {
    (publicationRepository.findById as jest.Mock).mockResolvedValue(
      Publication.create(
        'publication-1',
        'author-1',
        PublicationTitle.create('Titulo'),
        PublicationContent.create('Contenido'),
      ),
    );

    const result = await useCase.execute(actor, {
      publicationId: 'publication-1',
      content: 'Buen progreso',
    });

    expect(result.publicationId).toBe('publication-1');
    expect(result.authorUserId).toBe('user-1');
    expect(result.content).toBe('Buen progreso');
    expect(commentRepository.save).toHaveBeenCalledTimes(1);
  });

  it('rejects empty comment content before persistence', async () => {
    (publicationRepository.findById as jest.Mock).mockResolvedValue(
      Publication.create(
        'publication-1',
        'author-1',
        PublicationTitle.create('Titulo'),
        PublicationContent.create('Contenido'),
      ),
    );

    await expect(
      useCase.execute(actor, { publicationId: 'publication-1', content: '' }),
    ).rejects.toThrow(PublicationDomainError);

    try {
      await useCase.execute(actor, {
        publicationId: 'publication-1',
        content: '',
      });
    } catch (error) {
      expect((error as PublicationDomainError).code).toBe(
        PublicationErrorCode.PUBLICATION_COMMENT_CONTENT_REQUIRED,
      );
    }

    expect(commentRepository.save).not.toHaveBeenCalled();
  });

  it('rejects comment for a missing publication', async () => {
    (publicationRepository.findById as jest.Mock).mockResolvedValue(null);

    await expect(
      useCase.execute(actor, {
        publicationId: 'missing-publication',
        content: 'Comentario',
      }),
    ).rejects.toThrow(PublicationDomainError);
  });

  it('preserves normalized comment content', () => {
    const comment = PublicationComment.create(
      'comment-1',
      'publication-1',
      'user-1',
      PublicationCommentContent.create('  Comentario limpio  '),
    );

    expect(comment.content.value).toBe('Comentario limpio');
  });
});
