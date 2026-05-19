import {
  PublicationDomainError,
  PublicationErrorCode,
} from '../errors/publication-domain.error';

export const MAX_PUBLICATION_COMMENT_CONTENT_LENGTH = 500;

export class PublicationCommentContent {
  public readonly value: string;

  private constructor(value: string) {
    this.value = value;
  }

  public static create(value: string): PublicationCommentContent {
    const normalized = value?.trim() ?? '';

    if (normalized.length === 0) {
      throw new PublicationDomainError(
        PublicationErrorCode.PUBLICATION_COMMENT_CONTENT_REQUIRED,
        'Publication comment content is required',
        { content: value },
      );
    }

    if (normalized.length > MAX_PUBLICATION_COMMENT_CONTENT_LENGTH) {
      throw new PublicationDomainError(
        PublicationErrorCode.PUBLICATION_COMMENT_CONTENT_TOO_LONG,
        `Publication comment content cannot exceed ${MAX_PUBLICATION_COMMENT_CONTENT_LENGTH} characters`,
        { maxLength: MAX_PUBLICATION_COMMENT_CONTENT_LENGTH },
      );
    }

    return new PublicationCommentContent(normalized);
  }

  public static reconstitute(value: string): PublicationCommentContent {
    return new PublicationCommentContent(value);
  }
}
