import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RoutineTypeormEntity } from '../src/modules/training/infrastructure/persistence/typeorm/entities/routine-typeorm.entity';
import { RoutineDayTypeormEntity } from '../src/modules/training/infrastructure/persistence/typeorm/entities/routine-day-typeorm.entity';
import { ExerciseTypeormEntity } from '../src/modules/training/infrastructure/persistence/typeorm/entities/exercise-typeorm.entity';
import { WorkoutSessionTypeormEntity } from '../src/modules/training/infrastructure/persistence/typeorm/entities/workout-session-typeorm.entity';
import { WorkoutSessionExerciseTypeormEntity } from '../src/modules/training/infrastructure/persistence/typeorm/entities/workout-session-exercise-typeorm.entity';
import { WorkoutSessionSetTypeormEntity } from '../src/modules/training/infrastructure/persistence/typeorm/entities/workout-session-set-typeorm.entity';
import { TrainingModule } from '../src/modules/training/training.module';
import request from 'supertest';

/**
 * Creates a NestJS application with an in-memory SQLite database for e2e tests.
 * Provides a clean database per test suite via schema drop/sync.
 *
 * Usage:
 *   const { app, request } = await createTestingApp();
 *   // ... run tests ...
 *   await app.close();
 */
export async function createTestingApp(): Promise<{
  app: INestApplication;
  request: import('supertest').SuperTest<import('supertest').Test>;
}> {
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [
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
        ],
      }),
      TrainingModule,
    ],
  }).compile();

  const app = moduleFixture.createNestApplication();

  // Apply the same global pipes as production
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  await app.init();

  const server = app.getHttpServer() as Parameters<typeof request>[0];
  return {
    app,
    request: request(server),
  };
}
