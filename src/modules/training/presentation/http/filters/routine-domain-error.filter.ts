import {
  ExceptionFilter,
  Catch,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import {
  RoutineDomainError,
  RoutineErrorCode,
} from '../../../domain/errors/routine-domain.error';

@Catch(RoutineDomainError)
export class RoutineDomainErrorFilter implements ExceptionFilter {
  public catch(host: RoutineDomainError) {
    switch (host.code) {
      case RoutineErrorCode.ROUTINE_NOT_FOUND:
        throw new NotFoundException(host.message);
      case RoutineErrorCode.ROUTINE_NOT_OWNED:
        throw new ForbiddenException(host.message);
      case RoutineErrorCode.ROUTINE_TARGET_AUDIENCE_FORBIDDEN:
        throw new ForbiddenException(host.message);
      case RoutineErrorCode.ROUTINE_DUPLICATE_NAME:
        throw new ConflictException(host.message);
      case RoutineErrorCode.ROUTINE_LIMIT_EXCEEDED:
        throw new ConflictException(host.message);
      case RoutineErrorCode.ROUTINE_NAME_REQUIRED:
        throw new BadRequestException(host.message);
      case RoutineErrorCode.ROUTINE_NAME_EMPTY:
        throw new BadRequestException(host.message);
      case RoutineErrorCode.ROUTINE_DAYS_REQUIRED:
        throw new BadRequestException(host.message);
      case RoutineErrorCode.ROUTINE_DAYS_MINIMUM:
        throw new BadRequestException(host.message);
      case RoutineErrorCode.ROUTINE_DAY_INVALID_DAY_OF_WEEK:
        throw new BadRequestException(host.message);
      case RoutineErrorCode.EXERCISE_NAME_REQUIRED:
        throw new BadRequestException(host.message);
      case RoutineErrorCode.EXERCISE_DAY_NOT_FOUND:
        throw new NotFoundException(host.message);
      case RoutineErrorCode.EXERCISE_DAY_LIMIT_EXCEEDED:
        throw new ConflictException(host.message);
      case RoutineErrorCode.EXERCISE_NOT_FOUND:
        throw new NotFoundException(host.message);
      case RoutineErrorCode.EXERCISE_SETS_OUT_OF_RANGE:
        throw new BadRequestException(host.message);
      case RoutineErrorCode.EXERCISE_REPS_OUT_OF_RANGE:
        throw new BadRequestException(host.message);
      case RoutineErrorCode.EXERCISE_WEIGHT_INVALID:
        throw new BadRequestException(host.message);
      case RoutineErrorCode.ROUTINE_IS_ACTIVE:
        throw new ConflictException(host.message);
      default:
        throw new BadRequestException(host.message);
    }
  }
}
