import { PublicationComment } from './entities/publication-comment.entity';
import { PublicationReaction } from './entities/publication-reaction.entity';
import {
  PublicationDomainError,
  PublicationErrorCode,
} from './errors/publication-domain.error';
import { PublicationCommentContent } from './value-objects/publication-comment-content.value-object';

describe('Publication interactions domain', () => {
  it('creates a reaction linked to a publication and actor', () => {
    const reaction = PublicationReaction.create(
      'reaction-1',
      'publication-1',
      'user-1',
    );

    expect(reaction.id).toBe('reaction-1');
    expect(reaction.publicationId).toBe('publication-1');
    expect(reaction.authorUserId).toBe('user-1');
    expect(reaction.createdAt).toBeInstanceOf(Date);
  });

  it('rejects a reaction without author', () => {
    expect(() =>
      PublicationReaction.create('reaction-1', 'publication-1', ''),
    ).toThrow(PublicationDomainError);
  });

  it('creates a non-empty comment linked to a publication and actor', () => {
    const comment = PublicationComment.create(
      'comment-1',
      'publication-1',
      'user-1',
      PublicationCommentContent.create('Buen entrenamiento'),
    );

    expect(comment.id).toBe('comment-1');
    expect(comment.publicationId).toBe('publication-1');
    expect(comment.authorUserId).toBe('user-1');
    expect(comment.content.value).toBe('Buen entrenamiento');
  });

  it('rejects an empty comment', () => {
    expect(() => PublicationCommentContent.create('   ')).toThrow(
      PublicationDomainError,
    );

    try {
      PublicationCommentContent.create('   ');
    } catch (error) {
      expect((error as PublicationDomainError).code).toBe(
        PublicationErrorCode.PUBLICATION_COMMENT_CONTENT_REQUIRED,
      );
    }
  });

  it('rejects deleting a comment owned by another user', () => {
    const comment = PublicationComment.create(
      'comment-1',
      'publication-1',
      'user-1',
      PublicationCommentContent.create('Comentario'),
    );

    expect(() => comment.ensureOwnedBy('user-2')).toThrow(
      PublicationDomainError,
    );

    try {
      comment.ensureOwnedBy('user-2');
    } catch (error) {
      expect((error as PublicationDomainError).code).toBe(
        PublicationErrorCode.PUBLICATION_COMMENT_NOT_OWNED,
      );
    }
  });
});
