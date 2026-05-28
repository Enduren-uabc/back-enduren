import {
  Catch,
  ExceptionFilter,
  ArgumentsHost,
  HttpStatus,
} from '@nestjs/common';
import type { Response } from 'express';
import { UserDomainError } from '../../../../users/domain/errors/user-domain.error';

const STATUS_MAP: Record<string, HttpStatus> = {
  USER_EMAIL_ALREADY_EXISTS: HttpStatus.CONFLICT,
  USER_USERNAME_ALREADY_EXISTS: HttpStatus.CONFLICT,
  USER_NOT_FOUND: HttpStatus.NOT_FOUND,
  USER_INVALID_PASSWORD: HttpStatus.UNAUTHORIZED,
  USER_ACCOUNT_LOCKED: HttpStatus.LOCKED,
  USER_WEAK_PASSWORD: HttpStatus.BAD_REQUEST,
};

const STATUS_LABEL: Record<number, string> = {
  [HttpStatus.CONFLICT]: 'Conflict',
  [HttpStatus.NOT_FOUND]: 'Not Found',
  [HttpStatus.UNAUTHORIZED]: 'Unauthorized',
  [HttpStatus.LOCKED]: 'Locked',
  [HttpStatus.BAD_REQUEST]: 'Bad Request',
};

@Catch(UserDomainError)
export class UserDomainErrorFilter implements ExceptionFilter {
  catch(exception: UserDomainError, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const status = STATUS_MAP[exception.code] ?? HttpStatus.BAD_REQUEST;

    response.status(status).json({
      statusCode: status,
      code: exception.code,
      message: exception.message,
      error: STATUS_LABEL[status] ?? 'Bad Request',
    });
  }
}
