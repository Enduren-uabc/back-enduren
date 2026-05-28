import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { APP_GUARD, APP_FILTER } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { StorageModule } from './shared/storage/storage.module';
import { SharedEmailModule } from './modules/shared/email/email.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { TrainingModule } from './modules/training/training.module';
import { PublicationModule } from './modules/publication/publication.module';
import { ProfileModule } from './modules/profile/profile.module';
import { TrainerVerificationModule } from './modules/trainer-verification/trainer-verification.module';
import { TrainerLinkModule } from './modules/trainer-link/trainer-link.module';
import { TrainerPanelModule } from './modules/trainer-panel/trainer-panel.module';
import { TrainingRemindersModule } from './modules/training-reminders/training-reminders.module';
import { PrivacyNoticeModule } from './modules/privacy-notice/privacy-notice.module';
import { StorageSmokeTestModule } from './modules/storage-smoke-test/storage-smoke-test.module';
import { JwtAuthGuard } from './modules/auth/presentation/http/guards/jwt-auth.guard';
import { GlobalExceptionFilter } from './shared/exceptions/global-exception.filter';
import { ObservabilityModule } from './shared/observability/observability.module';
import { createTypeOrmModuleOptions } from './database/typeorm-options';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    EventEmitterModule.forRoot(),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) =>
        createTypeOrmModuleOptions({
          DB_USE_AZURE: configService.get<string | boolean>('DB_USE_AZURE'),
          DB_HOST: configService.get<string>('DB_HOST'),
          DB_PORT: configService.get<string | number>('DB_PORT'),
          DB_USERNAME: configService.get<string>('DB_USERNAME'),
          DB_PASSWORD: configService.get<string>('DB_PASSWORD'),
          DB_DATABASE: configService.get<string>('DB_DATABASE'),
          DB_SSL: configService.get<string | boolean>('DB_SSL'),
          DB_SSL_REJECT_UNAUTHORIZED: configService.get<string | boolean>(
            'DB_SSL_REJECT_UNAUTHORIZED',
          ),
          DB_MIGRATIONS_RUN: configService.get<string | boolean>(
            'DB_MIGRATIONS_RUN',
          ),
          DB_HOST_CLOUD: configService.get<string>('DB_HOST_CLOUD'),
          DB_PORT_CLOUD: configService.get<string | number>('DB_PORT_CLOUD'),
          DB_USERNAME_CLOUD: configService.get<string>('DB_USERNAME_CLOUD'),
          DB_PASSWORD_CLOUD: configService.get<string>('DB_PASSWORD_CLOUD'),
          DB_DATABASE_CLOUD: configService.get<string>('DB_DATABASE_CLOUD'),
          DB_SSL_CLOUD: configService.get<string | boolean>('DB_SSL_CLOUD'),
          DB_SSL_REJECT_UNAUTHORIZED_CLOUD: configService.get<string | boolean>(
            'DB_SSL_REJECT_UNAUTHORIZED_CLOUD',
          ),
          AZURE_DB_HOST: configService.get<string>('AZURE_DB_HOST'),
          AZURE_DB_PORT: configService.get<string | number>('AZURE_DB_PORT'),
          AZURE_DB_USERNAME: configService.get<string>('AZURE_DB_USERNAME'),
          AZURE_DB_PASSWORD: configService.get<string>('AZURE_DB_PASSWORD'),
          AZURE_DB_DATABASE: configService.get<string>('AZURE_DB_DATABASE'),
          AZURE_DB_SSL: configService.get<string | boolean>('AZURE_DB_SSL'),
          AZURE_DB_SSL_REJECT_UNAUTHORIZED: configService.get<string | boolean>(
            'AZURE_DB_SSL_REJECT_UNAUTHORIZED',
          ),
        }),
    }),
    ScheduleModule.forRoot(),
    ThrottlerModule.forRoot({
      throttlers: [
        {
          ttl: 60000,
          limit: 120,
        },
      ],
      errorMessage: 'Demasiadas solicitudes. Intenta de nuevo en un momento.',
    }),
    ObservabilityModule,
    StorageModule,
    SharedEmailModule,
    AuthModule,
    UsersModule,
    TrainingModule,
    PublicationModule,
    ProfileModule,
    TrainerVerificationModule,
    TrainerLinkModule,
    TrainerPanelModule,
    TrainingRemindersModule,
    PrivacyNoticeModule,
    StorageSmokeTestModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_FILTER,
      useClass: GlobalExceptionFilter,
    },
  ],
})
export class AppModule {}
