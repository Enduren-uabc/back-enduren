import {
  PublicationDomainError,
  PublicationErrorCode,
} from '../errors/publication-domain.error';

export const MAX_PUBLICATION_MEDIA_URLS = 10;

export class PublicationMediaUrls {
  public readonly values: string[];

  private constructor(values: string[]) {
    this.values = [...values];
  }

  public static create(values: string[] = []): PublicationMediaUrls {
    if (values.length > MAX_PUBLICATION_MEDIA_URLS) {
      throw new PublicationDomainError(
        PublicationErrorCode.PUBLICATION_MEDIA_URL_LIMIT_EXCEEDED,
        `Publication cannot contain more than ${MAX_PUBLICATION_MEDIA_URLS} media URLs`,
        { count: values.length, max: MAX_PUBLICATION_MEDIA_URLS },
      );
    }

    const normalized = values.map((value) => value.trim());

    for (const value of normalized) {
      if (!PublicationMediaUrls.isValidUrl(value)) {
        throw new PublicationDomainError(
          PublicationErrorCode.PUBLICATION_MEDIA_URL_INVALID,
          'Publication media URL is invalid',
          { url: value },
        );
      }
    }

    return new PublicationMediaUrls([...new Set(normalized)]);
  }

  public static reconstitute(values: string[]): PublicationMediaUrls {
    return new PublicationMediaUrls(values);
  }

  private static isValidUrl(value: string): boolean {
    try {
      const url = new URL(value);
      return url.protocol === 'http:' || url.protocol === 'https:';
    } catch {
      return false;
    }
  }
}
