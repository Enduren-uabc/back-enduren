import { Catch, ExceptionFilter, ArgumentsHost } from '@nestjs/common';
import { Response } from 'express';
import { UserDomainError } from '../../../../users/domain/errors/user-domain.error';

@Catch(UserDomainError)
export class UserDomainErrorFilter implements ExceptionFilter {
  catch(exception: UserDomainError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const status = 400;

    response.status(status).json({
      statusCode: status,
      code: exception.code,
      message: exception.message,
    });
  }
}
