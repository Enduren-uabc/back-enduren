import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { DiscoveryService } from '@nestjs/core';
import { RequestContextService } from './request-context.service';
import { sanitizeForLog } from './log-sanitizer';

type ExecutableUseCase = {
  execute: (...args: unknown[]) => unknown;
};

@Injectable()
export class UseCaseLoggingService implements OnModuleInit {
  private readonly logger = new Logger(UseCaseLoggingService.name);
  private readonly wrapped = new WeakSet<object>();

  constructor(
    private readonly discoveryService: DiscoveryService,
    private readonly requestContext: RequestContextService,
  ) {}

  onModuleInit(): void {
    const providers = this.discoveryService.getProviders();
    let wrappedCount = 0;

    for (const provider of providers) {
      const instance = provider.instance as Partial<ExecutableUseCase> | null;
      const metatypeName =
        provider.metatype?.name ?? instance?.constructor?.name;

      if (
        !instance ||
        typeof instance !== 'object' ||
        typeof instance.execute !== 'function' ||
        !metatypeName?.endsWith('UseCase') ||
        this.wrapped.has(instance)
      ) {
        continue;
      }

      this.wrapExecute(instance as ExecutableUseCase, metatypeName);
      this.wrapped.add(instance);
      wrappedCount += 1;
    }

    this.logger.log(
      JSON.stringify({
        event: 'use_case.logging.initialized',
        wrappedUseCases: wrappedCount,
      }),
    );
  }

  private wrapExecute(instance: ExecutableUseCase, useCaseName: string): void {
    const originalExecute = instance.execute.bind(instance);

    instance.execute = (...args: unknown[]) => {
      const startedAt = Date.now();
      const context = this.requestContext.get();

      this.logger.log(
        JSON.stringify({
          event: 'use_case.started',
          requestId: context?.requestId,
          method: context?.method,
          path: context?.path,
          actorId: context?.actorId,
          useCase: useCaseName,
          input: sanitizeForLog(args),
        }),
      );

      try {
        const result = originalExecute(...args);

        if (isPromiseLike(result)) {
          return result
            .then((value) => {
              this.logSuccess(useCaseName, startedAt, value);
              return value;
            })
            .catch((error: unknown) => {
              this.logFailure(useCaseName, startedAt, error);
              throw error;
            });
        }

        this.logSuccess(useCaseName, startedAt, result);
        return result;
      } catch (error) {
        this.logFailure(useCaseName, startedAt, error);
        throw error;
      }
    };
  }

  private logSuccess(
    useCaseName: string,
    startedAt: number,
    output: unknown,
  ): void {
    const context = this.requestContext.get();
    this.logger.log(
      JSON.stringify({
        event: 'use_case.completed',
        requestId: context?.requestId,
        method: context?.method,
        path: context?.path,
        actorId: context?.actorId,
        useCase: useCaseName,
        durationMs: Date.now() - startedAt,
        output: sanitizeForLog(output),
      }),
    );
  }

  private logFailure(
    useCaseName: string,
    startedAt: number,
    error: unknown,
  ): void {
    const context = this.requestContext.get();
    this.logger.error(
      JSON.stringify({
        event: 'use_case.failed',
        requestId: context?.requestId,
        method: context?.method,
        path: context?.path,
        actorId: context?.actorId,
        useCase: useCaseName,
        durationMs: Date.now() - startedAt,
        error: sanitizeForLog(error),
      }),
    );
  }
}

function isPromiseLike(value: unknown): value is Promise<unknown> {
  return (
    typeof value === 'object' &&
    value !== null &&
    'then' in value &&
    typeof (value as { then?: unknown }).then === 'function'
  );
}
