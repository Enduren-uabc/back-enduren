import {
  Catch,
  ExceptionFilter,
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import {
  TrainerLinkDomainError,
  TrainerLinkErrorCode,
} from '../../../domain/errors/trainer-link.domain-error';

@Catch(TrainerLinkDomainError)
export class TrainerLinkErrorFilter implements ExceptionFilter {
  catch(exception: TrainerLinkDomainError): void {
    switch (exception.code) {
      case TrainerLinkErrorCode.LINK_REQUEST_NOT_FOUND:
      case TrainerLinkErrorCode.TRAINER_NOT_FOUND:
      case TrainerLinkErrorCode.LINK_NOT_FOUND:
        throw new NotFoundException(exception.message);
      case TrainerLinkErrorCode.LINK_REQUEST_ALREADY_EXISTS:
      case TrainerLinkErrorCode.LINK_ALREADY_ACTIVE:
      case TrainerLinkErrorCode.PENDING_REQUEST_EXISTS:
      case TrainerLinkErrorCode.CLIENT_ACTIVE_LINK_LIMIT:
      case TrainerLinkErrorCode.TRAINER_ACTIVE_CLIENT_LIMIT:
      case TrainerLinkErrorCode.LINK_REQUEST_CANNOT_BE_CANCELLED:
      case TrainerLinkErrorCode.LINK_REQUEST_CANNOT_BE_ACCEPTED:
      case TrainerLinkErrorCode.LINK_REQUEST_CANNOT_BE_REJECTED:
      case TrainerLinkErrorCode.LINK_ALREADY_INACTIVE:
        throw new ConflictException(exception.message);
      case TrainerLinkErrorCode.UNAUTHORIZED_LINK_ACCESS:
      case TrainerLinkErrorCode.TRAINER_NOT_VERIFIED:
      case TrainerLinkErrorCode.CANNOT_LINK_TO_SELF:
        throw new ForbiddenException(exception.message);
      default:
        throw new BadRequestException(exception.message);
    }
  }
}
