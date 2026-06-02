import {
  Catch,
  ExceptionFilter,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import type { Response } from 'express';

const STATUS_TO_LABEL: Record<number, string> = {
  [HttpStatus.BAD_REQUEST]: 'Bad Request',
  [HttpStatus.UNAUTHORIZED]: 'Unauthorized',
  [HttpStatus.FORBIDDEN]: 'Forbidden',
  [HttpStatus.NOT_FOUND]: 'Not Found',
  [HttpStatus.CONFLICT]: 'Conflict',
  [HttpStatus.UNPROCESSABLE_ENTITY]: 'Unprocessable Entity',
  [HttpStatus.TOO_MANY_REQUESTS]: 'Too Many Requests',
  [HttpStatus.LOCKED]: 'Locked',
  [HttpStatus.INTERNAL_SERVER_ERROR]: 'Internal Server Error',
};

function statusToCode(status: number): string {
  const map: Record<number, string> = {
    [HttpStatus.BAD_REQUEST]: 'BAD_REQUEST',
    [HttpStatus.UNAUTHORIZED]: 'UNAUTHORIZED',
    [HttpStatus.FORBIDDEN]: 'FORBIDDEN',
    [HttpStatus.NOT_FOUND]: 'NOT_FOUND',
    [HttpStatus.CONFLICT]: 'CONFLICT',
    [HttpStatus.UNPROCESSABLE_ENTITY]: 'VALIDATION_ERROR',
    [HttpStatus.TOO_MANY_REQUESTS]: 'RATE_LIMITED',
    [HttpStatus.LOCKED]: 'ACCOUNT_LOCKED',
  };
  return map[status] ?? 'INTERNAL_ERROR';
}

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    const { status, code, message } = this.resolveError(exception);

    this.sendErrorResponse(response, status, code, message);
  }

  private resolveError(
    exception: unknown,
  ): { status: number; code: string; message: string } {
    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let code = 'INTERNAL_ERROR';
    let message = 'Tuvimos un problema. Intenta de nuevo en un momento.';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const body = exception.getResponse();

      if (typeof body === 'object' && body !== null) {
        const bodyRecord = body as Record<string, unknown>;
        message =
          typeof bodyRecord.message === 'string'
            ? bodyRecord.message
            : Array.isArray(bodyRecord.message)
              ? (bodyRecord.message as string[]).join('; ')
              : message;
        code =
          typeof bodyRecord.code === 'string'
            ? bodyRecord.code
            : statusToCode(status);
      } else {
        code = statusToCode(status);
        message = typeof body === 'string' ? body : message;
      }
    }

    return { status, code, message };
  }

  private sendErrorResponse(
    response: Response,
    status: number,
    code: string,
    message: string,
  ): void {
    response.status(status).json({
      statusCode: status,
      code,
      message,
      error: STATUS_TO_LABEL[status] ?? 'Internal Server Error',
    });
  }
}
