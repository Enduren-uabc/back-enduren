import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { randomUUID } from 'crypto';
import { Observable } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { RequestContextService } from './request-context.service';
import { sanitizeForLog } from './log-sanitizer';

@Injectable()
export class HttpLoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(HttpLoggingInterceptor.name);

  constructor(private readonly requestContext: RequestContextService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (context.getType() !== 'http') {
      return next.handle();
    }

    const http = context.switchToHttp();
    const request = http.getRequest<Request>();
    const response = http.getResponse<Response>();
    const startedAt = Date.now();
    const requestId =
      request.headers['x-request-id']?.toString() ?? randomUUID();
    const actorId = getActorId(request);

    response.setHeader('x-request-id', requestId);
    response.locals.actorId = actorId;

    const requestContext = {
      requestId,
      method: request.method,
      path: request.originalUrl ?? request.url,
      actorId,
    };

    return new Observable((subscriber) => {
      this.requestContext.run(requestContext, () => {
        this.logger.log(
          this.stringify({
            event: 'http.request.started',
            ...requestContext,
            query: sanitizeForLog(request.query),
            body: sanitizeForLog(request.body),
            userAgent: request.headers['user-agent'],
            clientType: request.headers['x-client-type'],
          }),
        );

        next
          .handle()
          .pipe(
            tap((body) => {
              this.logger.log(
                this.stringify({
                  event: 'http.request.completed',
                  ...requestContext,
                  statusCode: response.statusCode,
                  durationMs: Date.now() - startedAt,
                  response: sanitizeForLog(body),
                }),
              );
            }),
            catchError((error: unknown) => {
              this.logger.error(
                this.stringify({
                  event: 'http.request.failed',
                  ...requestContext,
                  statusCode: response.statusCode,
                  durationMs: Date.now() - startedAt,
                  error: sanitizeForLog(error),
                }),
              );
              throw error;
            }),
          )
          .subscribe(subscriber);
      });
    });
  }

  private stringify(payload: Record<string, unknown>): string {
    return JSON.stringify(payload);
  }
}

function getActorId(request: Request): string | undefined {
  const user = request.user;
  return user?.sub ?? user?.id;
}
