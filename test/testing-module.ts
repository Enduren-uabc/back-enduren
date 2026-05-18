import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { RoutineTypeormEntity } from '../src/modules/training/infrastructure/persistence/typeorm/entities/routine-typeorm.entity';
import { RoutineDayTypeormEntity } from '../src/modules/training/infrastructure/persistence/typeorm/entities/routine-day-typeorm.entity';
import { ExerciseTypeormEntity } from '../src/modules/training/infrastructure/persistence/typeorm/entities/exercise-typeorm.entity';
import { WorkoutSessionTypeormEntity } from '../src/modules/training/infrastructure/persistence/typeorm/entities/workout-session-typeorm.entity';
import { WorkoutSessionExerciseTypeormEntity } from '../src/modules/training/infrastructure/persistence/typeorm/entities/workout-session-exercise-typeorm.entity';
import { WorkoutSessionSetTypeormEntity } from '../src/modules/training/infrastructure/persistence/typeorm/entities/workout-session-set-typeorm.entity';
import { ExerciseSetTypeormEntity } from '../src/modules/training/infrastructure/persistence/typeorm/entities/exercise-set-typeorm.entity';
import { TrainingStrategyTypeormEntity } from '../src/modules/training/infrastructure/persistence/typeorm/entities/training-strategy-typeorm.entity';
import { ExerciseCatalogTypeormEntity } from '../src/modules/training/infrastructure/persistence/typeorm/entities/exercise-catalog-typeorm.entity';
import { UserTypeormEntity } from '../src/modules/users/infrastructure/persistence/typeorm/entities/user-typeorm.entity';
import { RefreshTokenTypeormEntity } from '../src/modules/auth/infrastructure/persistence/typeorm/entities/refresh-token-typeorm.entity';
import { ProfileTypeormEntity } from '../src/modules/profile/infrastructure/persistence/typeorm/entities/profile-typeorm.entity';
import { SpecialtyCatalogTypeormEntity } from '../src/modules/trainer-verification/infrastructure/persistence/typeorm/entities/specialty-catalog-typeorm.entity';
import { TrainerCertificateTypeormEntity } from '../src/modules/trainer-verification/infrastructure/persistence/typeorm/entities/trainer-certificate-typeorm.entity';
import { TrainerIdDocumentTypeormEntity } from '../src/modules/trainer-verification/infrastructure/persistence/typeorm/entities/trainer-id-document-typeorm.entity';
import { TrainerVerificationSpecialtyTypeormEntity } from '../src/modules/trainer-verification/infrastructure/persistence/typeorm/entities/trainer-verification-specialty-typeorm.entity';
import { TrainerVerificationTypeormEntity } from '../src/modules/trainer-verification/infrastructure/persistence/typeorm/entities/trainer-verification-typeorm.entity';
import { TrainingModule } from '../src/modules/training/training.module';
import { AuthModule } from '../src/modules/auth/auth.module';
import { UsersModule } from '../src/modules/users/users.module';
import { ProfileModule } from '../src/modules/profile/profile.module';
import { TrainerVerificationModule } from '../src/modules/trainer-verification/trainer-verification.module';
import * as supertest from 'supertest';
import cookieParser from 'cookie-parser';

/**
 * Creates a NestJS application with an in-memory SQLite database for e2e tests.
 * Provides a clean database per test suite via schema drop/sync.
 *
 * Usage:
 *   const { app, agent } = await createTestingApp();
 *   // ... run tests ...
 *   await app.close();
 */
export async function createTestingApp(): Promise<{
  app: INestApplication;
  agent: supertest.SuperAgentTest;
}> {
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [
      ConfigModule.forRoot({
        isGlobal: true,
        envFilePath: '.env',
      }),
      TypeOrmModule.forRoot({
        type: 'better-sqlite3',
        database: ':memory:',
        synchronize: true,
        dropSchema: true,
        entities: [
          RoutineTypeormEntity,
          RoutineDayTypeormEntity,
          ExerciseTypeormEntity,
          WorkoutSessionTypeormEntity,
          WorkoutSessionExerciseTypeormEntity,
          WorkoutSessionSetTypeormEntity,
          ExerciseSetTypeormEntity,
          TrainingStrategyTypeormEntity,
          ExerciseCatalogTypeormEntity,
          UserTypeormEntity,
          RefreshTokenTypeormEntity,
          ProfileTypeormEntity,
          TrainerVerificationTypeormEntity,
          TrainerVerificationSpecialtyTypeormEntity,
          TrainerIdDocumentTypeormEntity,
          TrainerCertificateTypeormEntity,
          SpecialtyCatalogTypeormEntity,
        ],
      }),
      TrainingModule,
      AuthModule,
      UsersModule,
      ProfileModule,
      TrainerVerificationModule,
    ],
  }).compile();

  const app = moduleFixture.createNestApplication();
  app.use(cookieParser());

  // Apply the same global pipes as production
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  await app.init();

  const agent = supertest.agent(app.getHttpServer());
  return {
    app,
    agent,
  };
}
