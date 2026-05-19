import {
  PublicationDomainError,
  PublicationErrorCode,
} from '../errors/publication-domain.error';

export const MAX_PUBLICATION_CONTENT_LENGTH = 2000;

export class PublicationContent {
  public readonly value: string;

  private constructor(value: string) {
    this.value = value;
  }

  public static create(value: string): PublicationContent {
    const normalized = value?.trim() ?? '';

    if (normalized.length === 0) {
      throw new PublicationDomainError(
        PublicationErrorCode.PUBLICATION_CONTENT_REQUIRED,
        'Publication content is required',
        { content: value },
      );
    }

    if (normalized.length > MAX_PUBLICATION_CONTENT_LENGTH) {
      throw new PublicationDomainError(
        PublicationErrorCode.PUBLICATION_CONTENT_TOO_LONG,
        `Publication content cannot exceed ${MAX_PUBLICATION_CONTENT_LENGTH} characters`,
        { maxLength: MAX_PUBLICATION_CONTENT_LENGTH },
      );
    }

    return new PublicationContent(normalized);
  }

  public static reconstitute(value: string): PublicationContent {
    return new PublicationContent(value);
  }
}
