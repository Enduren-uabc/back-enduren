import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { StorageModule } from './shared/storage/storage.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { TrainingModule } from './modules/training/training.module';
import { PublicationModule } from './modules/publication/publication.module';
import { ProfileModule } from './modules/profile/profile.module';
import { TrainerVerificationModule } from './modules/trainer-verification/trainer-verification.module';
import { StorageSmokeTestModule } from './modules/storage-smoke-test/storage-smoke-test.module';
import { JwtAuthGuard } from './modules/auth/presentation/http/guards/jwt-auth.guard';
import { ObservabilityModule } from './shared/observability/observability.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres' as const,
        host: configService.get<string>('DB_HOST', 'localhost'),
        port: configService.get<number>('DB_PORT', 5432),
        username: configService.get<string>('DB_USERNAME', 'postgres'),
        password: configService.get<string>('DB_PASSWORD', 'postgres'),
        database: configService.get<string>('DB_DATABASE', 'endure'),
        synchronize: false,
        autoLoadEntities: true,
        migrations: [__dirname + '/migrations/*{.ts,.js}'],
        migrationsRun: true,
      }),
    }),
    ObservabilityModule,
    StorageModule,
    AuthModule,
    UsersModule,
    TrainingModule,
    PublicationModule,
    ProfileModule,
    TrainerVerificationModule,
    StorageSmokeTestModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}
