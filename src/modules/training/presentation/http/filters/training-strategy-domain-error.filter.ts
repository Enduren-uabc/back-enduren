import {
  ExceptionFilter,
  Catch,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import {
  TrainingStrategyDomainError,
  TrainingStrategyErrorCode,
} from '../../../domain/errors/training-strategy-domain.error';

@Catch(TrainingStrategyDomainError)
export class TrainingStrategyDomainErrorFilter implements ExceptionFilter {
  public catch(host: TrainingStrategyDomainError) {
    switch (host.code) {
      case TrainingStrategyErrorCode.STRATEGY_NOT_FOUND:
        throw new NotFoundException(host.message);
      case TrainingStrategyErrorCode.STRATEGY_KEY_UNKNOWN:
        throw new BadRequestException(host.message);
      case TrainingStrategyErrorCode.STRATEGY_KEY_REQUIRED:
        throw new BadRequestException(host.message);
      case TrainingStrategyErrorCode.STRATEGY_NAME_REQUIRED:
        throw new BadRequestException(host.message);
      case TrainingStrategyErrorCode.STRATEGY_RULES_INVALID:
        throw new BadRequestException(host.message);
      case TrainingStrategyErrorCode.EXERCISE_SETS_OUT_OF_RANGE:
        throw new BadRequestException(host.message);
      case TrainingStrategyErrorCode.EXERCISE_REPS_OUT_OF_RANGE:
        throw new BadRequestException(host.message);
      case TrainingStrategyErrorCode.EXERCISE_WEIGHT_INVALID:
        throw new BadRequestException(host.message);
      default:
        throw new BadRequestException(host.message);
    }
  }
}
