import {
  PublicationDomainError,
  PublicationErrorCode,
} from '../errors/publication-domain.error';

export class PublicationReaction {
  public readonly id: string;
  public readonly publicationId: string;
  public readonly authorUserId: string;
  public readonly createdAt: Date;

  private constructor(
    id: string,
    publicationId: string,
    authorUserId: string,
    createdAt: Date,
  ) {
    this.id = id;
    this.publicationId = publicationId;
    this.authorUserId = authorUserId;
    this.createdAt = createdAt;
  }

  public static create(
    id: string,
    publicationId: string,
    authorUserId: string,
  ): PublicationReaction {
    if (!authorUserId || authorUserId.trim().length === 0) {
      throw new PublicationDomainError(
        PublicationErrorCode.PUBLICATION_REACTION_AUTHOR_REQUIRED,
        'Publication reaction author is required',
        { authorUserId },
      );
    }

    return new PublicationReaction(
      id,
      publicationId,
      authorUserId.trim(),
      new Date(),
    );
  }

  public static reconstitute(
    id: string,
    publicationId: string,
    authorUserId: string,
    createdAt: Date,
  ): PublicationReaction {
    return new PublicationReaction(id, publicationId, authorUserId, createdAt);
  }
}
