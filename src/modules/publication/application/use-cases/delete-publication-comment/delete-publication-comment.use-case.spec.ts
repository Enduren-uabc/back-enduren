import { PublicationComment } from '../../../domain/entities/publication-comment.entity';
import {
  PublicationDomainError,
  PublicationErrorCode,
} from '../../../domain/errors/publication-domain.error';
import { PublicationCommentRepository } from '../../../domain/repositories/publication-comment.repository';
import { PublicationCommentContent } from '../../../domain/value-objects/publication-comment-content.value-object';
import { CurrentActor } from '../../ports/current-actor.port';
import { DeletePublicationCommentUseCase } from './delete-publication-comment.use-case';

describe('DeletePublicationCommentUseCase', () => {
  let useCase: DeletePublicationCommentUseCase;
  let commentRepository: PublicationCommentRepository;
  const actor: CurrentActor = { userId: 'user-1' };

  const createComment = (authorUserId = 'user-1') =>
    PublicationComment.create(
      'comment-1',
      'publication-1',
      authorUserId,
      PublicationCommentContent.create('Comentario'),
    );

  beforeEach(() => {
    commentRepository = {
      save: jest.fn(),
      findById: jest.fn(),
      findByPublicationId: jest.fn(),
      delete: jest.fn(() => Promise.resolve()),
    };
    useCase = new DeletePublicationCommentUseCase(commentRepository);
  });

  it('deletes an own comment', async () => {
    (commentRepository.findById as jest.Mock).mockResolvedValue(
      createComment(),
    );

    const result = await useCase.execute(actor, { commentId: 'comment-1' });

    expect(result).toEqual({ id: 'comment-1', deleted: true });
    expect(commentRepository.delete).toHaveBeenCalledTimes(1);
  });

  it('rejects deletion from a different user', async () => {
    (commentRepository.findById as jest.Mock).mockResolvedValue(
      createComment('user-2'),
    );

    await expect(
      useCase.execute(actor, { commentId: 'comment-1' }),
    ).rejects.toThrow(PublicationDomainError);

    try {
      await useCase.execute(actor, { commentId: 'comment-1' });
    } catch (error) {
      expect((error as PublicationDomainError).code).toBe(
        PublicationErrorCode.PUBLICATION_COMMENT_NOT_OWNED,
      );
    }

    expect(commentRepository.delete).not.toHaveBeenCalled();
  });

  it('rejects deletion when comment does not exist', async () => {
    (commentRepository.findById as jest.Mock).mockResolvedValue(null);

    await expect(
      useCase.execute(actor, { commentId: 'missing-comment' }),
    ).rejects.toThrow(PublicationDomainError);

    expect(commentRepository.delete).not.toHaveBeenCalled();
  });
});
