import {
  BadRequestException,
  Catch,
  ConflictException,
  ExceptionFilter,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import {
  TrainerVerificationDomainError,
  TrainerVerificationErrorCode,
} from '../../../domain/errors/trainer-verification.domain-error';

@Catch(TrainerVerificationDomainError)
export class TrainerVerificationErrorFilter implements ExceptionFilter {
  catch(exception: TrainerVerificationDomainError): void {
    switch (exception.code) {
      case TrainerVerificationErrorCode.VERIFICATION_NOT_FOUND:
        throw new NotFoundException(exception.message);
      case TrainerVerificationErrorCode.VERIFICATION_ALREADY_EXISTS:
      case TrainerVerificationErrorCode.VERIFICATION_ALREADY_APPROVED:
      case TrainerVerificationErrorCode.VERIFICATION_NOT_REJECTED:
      case TrainerVerificationErrorCode.ALREADY_ASSIGNED:
        throw new ConflictException(exception.message);
      case TrainerVerificationErrorCode.NOT_AUTHORIZED:
      case TrainerVerificationErrorCode.NOT_TRAINER_ROLE:
      case TrainerVerificationErrorCode.NOT_ADMIN_ROLE:
      case TrainerVerificationErrorCode.NOT_ASSIGNED_TO_YOU:
        throw new ForbiddenException(exception.message);
      default:
        throw new BadRequestException(exception.message);
    }
  }
}
