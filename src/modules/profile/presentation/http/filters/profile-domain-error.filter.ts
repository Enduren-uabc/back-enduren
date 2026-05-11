import {
  ExceptionFilter,
  Catch,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import {
  ProfileDomainError,
  ProfileErrorCode,
} from '../../../domain/errors/profile-domain.error';

@Catch(ProfileDomainError)
export class ProfileDomainErrorFilter implements ExceptionFilter {
  public catch(host: ProfileDomainError) {
    switch (host.code) {
      case ProfileErrorCode.PROFILE_NOT_FOUND:
        throw new NotFoundException(host.message);
      case ProfileErrorCode.PROFILE_ALREADY_EXISTS:
        throw new ConflictException(host.message);
      default:
        throw new BadRequestException(host.message);
    }
  }
}
