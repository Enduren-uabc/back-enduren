import { Test } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { APP_GUARD } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import { AuthModule } from '../src/modules/auth/auth.module';
import { UserTypeormEntity } from '../src/modules/users/infrastructure/persistence/typeorm/entities/user-typeorm.entity';
import { ProfileTypeormEntity } from '../src/modules/profile/infrastructure/persistence/typeorm/entities/profile-typeorm.entity';
import { SocialProfileTypeormEntity } from '../src/modules/profile/infrastructure/persistence/typeorm/entities/social-profile-typeorm.entity';
import { JwtAuthGuard } from '../src/modules/auth/presentation/http/guards/jwt-auth.guard';
import { RefreshTokenTypeormEntity } from '../src/modules/auth/infrastructure/persistence/typeorm/entities/refresh-token-typeorm.entity';
import { EmailVerificationTokenTypeormEntity } from '../src/modules/auth/infrastructure/persistence/typeorm/entities/email-verification-token-typeorm.entity';
import { PasswordResetTokenTypeormEntity } from '../src/modules/auth/infrastructure/persistence/typeorm/entities/password-reset-token-typeorm.entity';
import { SocialAuthCodeTypeormEntity } from '../src/modules/auth/infrastructure/persistence/typeorm/entities/social-auth-code-typeorm.entity';
import {
  webSessionProtection,
  allowedWebOrigins,
} from '../src/modules/auth/infrastructure/providers/web-session-policy';
import { TrainingModule } from '../src/modules/training/training.module';
import { RoutineTypeormEntity } from '../src/modules/training/infrastructure/persistence/typeorm/entities/routine-typeorm.entity';
import { RoutineDayTypeormEntity } from '../src/modules/training/infrastructure/persistence/typeorm/entities/routine-day-typeorm.entity';
import { ExerciseTypeormEntity } from '../src/modules/training/infrastructure/persistence/typeorm/entities/exercise-typeorm.entity';
import { ExerciseSetTypeormEntity } from '../src/modules/training/infrastructure/persistence/typeorm/entities/exercise-set-typeorm.entity';
import { WorkoutSessionTypeormEntity } from '../src/modules/training/infrastructure/persistence/typeorm/entities/workout-session-typeorm.entity';
import { WorkoutSessionExerciseTypeormEntity } from '../src/modules/training/infrastructure/persistence/typeorm/entities/workout-session-exercise-typeorm.entity';
import { WorkoutSessionSetTypeormEntity } from '../src/modules/training/infrastructure/persistence/typeorm/entities/workout-session-set-typeorm.entity';
import { ExerciseCatalogTypeormEntity } from '../src/modules/training/infrastructure/persistence/typeorm/entities/exercise-catalog-typeorm.entity';
import { TrainingStrategyTypeormEntity } from '../src/modules/training/infrastructure/persistence/typeorm/entities/training-strategy-typeorm.entity';
import { DefaultRoutineTemplateTypeormEntity } from '../src/modules/training/infrastructure/persistence/typeorm/entities/default-routine-template-typeorm.entity';
import { DefaultRoutineTemplateExerciseTypeormEntity } from '../src/modules/training/infrastructure/persistence/typeorm/entities/default-routine-template-exercise-typeorm.entity';

export async function createAuthTestingApp(
  options: { training?: boolean } = {},
) {
  const fixture = await Test.createTestingModule({
    imports: [
      ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env.test' }),
      EventEmitterModule.forRoot(),
      TypeOrmModule.forRoot({
        type: 'better-sqlite3',
        database: ':memory:',
        synchronize: true,
        entities: [
          UserTypeormEntity,
          ProfileTypeormEntity,
          SocialProfileTypeormEntity,
          RefreshTokenTypeormEntity,
          EmailVerificationTokenTypeormEntity,
          PasswordResetTokenTypeormEntity,
          SocialAuthCodeTypeormEntity,
          ...(options.training
            ? [
                RoutineTypeormEntity,
                RoutineDayTypeormEntity,
                ExerciseTypeormEntity,
                ExerciseSetTypeormEntity,
                WorkoutSessionTypeormEntity,
                WorkoutSessionExerciseTypeormEntity,
                WorkoutSessionSetTypeormEntity,
                ExerciseCatalogTypeormEntity,
                TrainingStrategyTypeormEntity,
                DefaultRoutineTemplateTypeormEntity,
                DefaultRoutineTemplateExerciseTypeormEntity,
              ]
            : []),
        ],
        retryAttempts: 0,
      }),
      AuthModule,
      ...(options.training ? [TrainingModule] : []),
    ],
    providers: [{ provide: APP_GUARD, useClass: JwtAuthGuard }],
  }).compile();
  const app = fixture.createNestApplication();
  app.use(cookieParser());
  app.use(webSessionProtection);
  app.enableCors({
    origin: (origin, callback) =>
      callback(null, !origin || allowedWebOrigins().includes(origin)),
    credentials: true,
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  await app.init();
  return { app, agent: request.agent(app.getHttpServer()) };
}
