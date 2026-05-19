import { Global, MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { APP_INTERCEPTOR, DiscoveryModule } from '@nestjs/core';
import { HttpLoggingInterceptor } from './http-logging.interceptor';
import { RequestLoggingMiddleware } from './request-logging.middleware';
import { RequestContextService } from './request-context.service';
import { UseCaseLoggingService } from './use-case-logging.service';

@Global()
@Module({
  imports: [DiscoveryModule],
  providers: [
    RequestContextService,
    RequestLoggingMiddleware,
    UseCaseLoggingService,
    {
      provide: APP_INTERCEPTOR,
      useClass: HttpLoggingInterceptor,
    },
  ],
  exports: [RequestContextService],
})
export class ObservabilityModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(RequestLoggingMiddleware).forRoutes('*');
  }
}
