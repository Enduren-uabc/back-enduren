import {
  PublicationDomainError,
  PublicationErrorCode,
} from '../errors/publication-domain.error';
import { PublicationCommentContent } from '../value-objects/publication-comment-content.value-object';

export class PublicationComment {
  public readonly id: string;
  public readonly publicationId: string;
  public readonly authorUserId: string;
  public readonly content: PublicationCommentContent;
  public readonly createdAt: Date;

  private constructor(
    id: string,
    publicationId: string,
    authorUserId: string,
    content: PublicationCommentContent,
    createdAt: Date,
  ) {
    this.id = id;
    this.publicationId = publicationId;
    this.authorUserId = authorUserId;
    this.content = content;
    this.createdAt = createdAt;
  }

  public static create(
    id: string,
    publicationId: string,
    authorUserId: string,
    content: PublicationCommentContent,
  ): PublicationComment {
    if (!authorUserId || authorUserId.trim().length === 0) {
      throw new PublicationDomainError(
        PublicationErrorCode.PUBLICATION_COMMENT_AUTHOR_REQUIRED,
        'Publication comment author is required',
        { authorUserId },
      );
    }

    return new PublicationComment(
      id,
      publicationId,
      authorUserId.trim(),
      content,
      new Date(),
    );
  }

  public static reconstitute(
    id: string,
    publicationId: string,
    authorUserId: string,
    content: PublicationCommentContent,
    createdAt: Date,
  ): PublicationComment {
    return new PublicationComment(
      id,
      publicationId,
      authorUserId,
      content,
      createdAt,
    );
  }

  public ensureOwnedBy(actorUserId: string): void {
    if (this.authorUserId !== actorUserId) {
      throw new PublicationDomainError(
        PublicationErrorCode.PUBLICATION_COMMENT_NOT_OWNED,
        'Publication comment does not belong to the current user',
        { commentId: this.id, actorUserId },
      );
    }
  }
}
