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
    const defaultMessage = 'Tuvimos un problema. Intenta de nuevo en un momento.';
    const defaultCode = 'INTERNAL_ERROR';

    if (!(exception instanceof HttpException)) {
      return { status: HttpStatus.INTERNAL_SERVER_ERROR, code: defaultCode, message: defaultMessage };
    }

    const status = exception.getStatus();
    const body = exception.getResponse();
    const { message, code } = this.parseExceptionBody(body, status, defaultMessage);

    return { status, code, message };
  }

  private parseExceptionBody(
    body: unknown,
    status: number,
    defaultMessage: string,
  ): { message: string; code: string } {
    if (typeof body === 'object' && body !== null) {
      const bodyRecord = body as Record<string, unknown>;
      const message =
        typeof bodyRecord.message === 'string'
          ? bodyRecord.message
          : Array.isArray(bodyRecord.message)
            ? (bodyRecord.message as string[]).join('; ')
            : defaultMessage;
      const code =
        typeof bodyRecord.code === 'string'
          ? bodyRecord.code
          : statusToCode(status);
      return { message, code };
    }

    return {
      message: typeof body === 'string' ? body : defaultMessage,
      code: statusToCode(status),
    };
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
