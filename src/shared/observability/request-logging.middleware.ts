import { Injectable, Logger, NestMiddleware } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';
import { randomUUID } from 'crypto';
import { RequestContextService } from './request-context.service';
import { sanitizeForLog } from './log-sanitizer';

@Injectable()
export class RequestLoggingMiddleware implements NestMiddleware {
  private readonly logger = new Logger(RequestLoggingMiddleware.name);

  constructor(private readonly requestContext: RequestContextService) {}

  use(request: Request, response: Response, next: NextFunction): void {
    const startedAt = Date.now();
    const requestId =
      request.headers['x-request-id']?.toString() ?? randomUUID();
    const path = request.originalUrl ?? request.url;

    request.headers['x-request-id'] = requestId;
    response.setHeader('x-request-id', requestId);

    response.on('finish', () => {
      const context = this.requestContext.get();
      this.logger.log(
        JSON.stringify({
          event: 'http.response.sent',
          requestId,
          method: request.method,
          path,
          actorId: response.locals.actorId ?? context?.actorId,
          statusCode: response.statusCode,
          durationMs: Date.now() - startedAt,
        }),
      );
    });

    this.requestContext.run(
      {
        requestId,
        method: request.method,
        path,
      },
      () => {
        this.logger.log(
          JSON.stringify({
            event: 'http.request.received',
            requestId,
            method: request.method,
            path,
            query: sanitizeForLog(request.query),
            body: sanitizeForLog(request.body),
            userAgent: request.headers['user-agent'],
            clientType: request.headers['x-client-type'],
          }),
        );

        next();
      },
    );
  }
}
