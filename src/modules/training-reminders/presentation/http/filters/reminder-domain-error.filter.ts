import {
  ExceptionFilter,
  Catch,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  BadRequestException,
  UnprocessableEntityException,
} from '@nestjs/common';
import {
  ReminderDomainError,
  ReminderErrorCode,
} from '../../../domain/errors/reminder-domain.error';

@Catch(ReminderDomainError)
export class ReminderDomainErrorFilter implements ExceptionFilter {
  public catch(host: ReminderDomainError) {
    switch (host.code) {
      case ReminderErrorCode.REMINDER_NOT_FOUND:
        throw new NotFoundException(host.message);
      case ReminderErrorCode.REMINDER_NOT_OWNED:
        throw new ForbiddenException(host.message);
      case ReminderErrorCode.REMINDER_ALREADY_DELETED:
        throw new ConflictException(host.message);
      case ReminderErrorCode.NO_ACTIVE_ROUTINE:
        throw new ConflictException(host.message);
      case ReminderErrorCode.ROUTINE_NOT_FOUND:
        throw new NotFoundException(host.message);
      case ReminderErrorCode.DAY_NOT_IN_ROUTINE:
        throw new UnprocessableEntityException(host.message);
      case ReminderErrorCode.INVALID_TIME_FORMAT:
        throw new UnprocessableEntityException(host.message);
      case ReminderErrorCode.INVALID_TIME_RANGE:
        throw new UnprocessableEntityException(host.message);
      case ReminderErrorCode.INVALID_DAY:
        throw new UnprocessableEntityException(host.message);
      default:
        throw new BadRequestException(host.message);
    }
  }
}
