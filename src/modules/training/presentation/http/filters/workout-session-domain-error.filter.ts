import {
  ExceptionFilter,
  Catch,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import {
  WorkoutSessionDomainError,
  WorkoutSessionErrorCode,
} from '../../../domain/errors/workout-session-domain.error';

@Catch(WorkoutSessionDomainError)
export class WorkoutSessionDomainErrorFilter implements ExceptionFilter {
  public catch(host: WorkoutSessionDomainError) {
    switch (host.code) {
      case WorkoutSessionErrorCode.SESSION_ALREADY_IN_PROGRESS:
        throw new ConflictException(host.message);
      case WorkoutSessionErrorCode.SESSION_NO_ACTIVE_ROUTINE:
        throw new NotFoundException(host.message);
      case WorkoutSessionErrorCode.SESSION_NOT_FOUND:
        throw new NotFoundException(host.message);
      case WorkoutSessionErrorCode.SESSION_NOT_IN_PROGRESS:
        throw new NotFoundException(host.message);
      case WorkoutSessionErrorCode.SESSION_ALREADY_FINISHED:
        throw new BadRequestException(host.message);
      case WorkoutSessionErrorCode.SESSION_SET_ALREADY_COMPLETED:
        throw new ConflictException(host.message);
      case WorkoutSessionErrorCode.SESSION_SET_MISSING_REQUIRED_DATA:
        throw new ConflictException(host.message);
      case WorkoutSessionErrorCode.SESSION_EXERCISE_SETS_INCOMPLETE:
        throw new ConflictException(host.message);
      case WorkoutSessionErrorCode.SESSION_EXERCISE_INDEX_INVALID:
        throw new NotFoundException(host.message);
      case WorkoutSessionErrorCode.SESSION_SET_NOT_FOUND:
        throw new NotFoundException(host.message);
      case WorkoutSessionErrorCode.SESSION_ALREADY_AT_LAST_EXERCISE:
        throw new ConflictException(host.message);
      default:
        throw new BadRequestException(host.message);
    }
  }
}
