import {
  BadRequestException,
  Catch,
  ExceptionFilter,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import {
  PublicationDomainError,
  PublicationErrorCode,
} from '../../../domain/errors/publication-domain.error';

@Catch(PublicationDomainError)
export class PublicationDomainErrorFilter implements ExceptionFilter {
  public catch(error: PublicationDomainError) {
    switch (error.code) {
      case PublicationErrorCode.PUBLICATION_NOT_FOUND:
      case PublicationErrorCode.PUBLICATION_COMMENT_NOT_FOUND:
        throw new NotFoundException(error.message);
      case PublicationErrorCode.PUBLICATION_NOT_OWNED:
      case PublicationErrorCode.PUBLICATION_COMMENT_NOT_OWNED:
        throw new ForbiddenException(error.message);
      case PublicationErrorCode.PUBLICATION_TITLE_REQUIRED:
      case PublicationErrorCode.PUBLICATION_TITLE_TOO_LONG:
      case PublicationErrorCode.PUBLICATION_CONTENT_REQUIRED:
      case PublicationErrorCode.PUBLICATION_CONTENT_TOO_LONG:
      case PublicationErrorCode.PUBLICATION_AUTHOR_REQUIRED:
      case PublicationErrorCode.PUBLICATION_UPDATE_EMPTY:
      case PublicationErrorCode.PUBLICATION_FEED_PAGINATION_INVALID:
      case PublicationErrorCode.PUBLICATION_FEED_FILTER_INVALID:
      case PublicationErrorCode.PUBLICATION_MEDIA_URL_INVALID:
      case PublicationErrorCode.PUBLICATION_MEDIA_URL_LIMIT_EXCEEDED:
      case PublicationErrorCode.PUBLICATION_COMMENT_CONTENT_REQUIRED:
      case PublicationErrorCode.PUBLICATION_COMMENT_CONTENT_TOO_LONG:
      case PublicationErrorCode.PUBLICATION_COMMENT_AUTHOR_REQUIRED:
      case PublicationErrorCode.PUBLICATION_REACTION_AUTHOR_REQUIRED:
      default:
        throw new BadRequestException(error.message);
    }
  }
}
