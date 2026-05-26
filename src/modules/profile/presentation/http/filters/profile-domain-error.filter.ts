import {
  BadRequestException,
  Catch,
  ConflictException,
  ExceptionFilter,
  NotFoundException,
} from '@nestjs/common';
import {
  ProfileDomainError,
  ProfileErrorCode,
} from '../../../domain/errors/profile-domain.error';

@Catch(ProfileDomainError)
export class ProfileDomainErrorFilter implements ExceptionFilter {
  public catch(error: ProfileDomainError) {
    switch (error.code) {
      case ProfileErrorCode.PROFILE_NOT_FOUND:
        throw new NotFoundException(error.message);
      case ProfileErrorCode.PROFILE_ALREADY_EXISTS:
      case ProfileErrorCode.PROFILE_SELF_FOLLOW_NOT_ALLOWED:
      case ProfileErrorCode.PROFILE_HANDLE_ALREADY_EXISTS:
        throw new ConflictException(error.message);
      case ProfileErrorCode.PROFILE_DISPLAY_NAME_REQUIRED:
      case ProfileErrorCode.PROFILE_HANDLE_REQUIRED:
      case ProfileErrorCode.PROFILE_BIO_TOO_LONG:
      case ProfileErrorCode.PROFILE_AVATAR_URL_INVALID:
      case ProfileErrorCode.PROFILE_UPDATE_EMPTY:
      case ProfileErrorCode.PROFILE_SEARCH_QUERY_INVALID:
      case ProfileErrorCode.PROFILE_PUBLICATIONS_PAGINATION_INVALID:
      default:
        throw new BadRequestException(error.message);
    }
  }
}
