import {
  PublicationDomainError,
  PublicationErrorCode,
} from '../errors/publication-domain.error';

export const MAX_PUBLICATION_TITLE_LENGTH = 120;

export class PublicationTitle {
  public readonly value: string;

  private constructor(value: string) {
    this.value = value;
  }

  public static create(value: string): PublicationTitle {
    const normalized = value?.trim() ?? '';

    if (normalized.length === 0) {
      throw new PublicationDomainError(
        PublicationErrorCode.PUBLICATION_TITLE_REQUIRED,
        'Publication title is required',
        { title: value },
      );
    }

    if (normalized.length > MAX_PUBLICATION_TITLE_LENGTH) {
      throw new PublicationDomainError(
        PublicationErrorCode.PUBLICATION_TITLE_TOO_LONG,
        `Publication title cannot exceed ${MAX_PUBLICATION_TITLE_LENGTH} characters`,
        { maxLength: MAX_PUBLICATION_TITLE_LENGTH },
      );
    }

    return new PublicationTitle(normalized);
  }

  public static reconstitute(value: string): PublicationTitle {
    return new PublicationTitle(value);
  }
}
