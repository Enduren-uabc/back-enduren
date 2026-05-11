import { INestApplication } from '@nestjs/common';
import { createTestingApp } from './testing-module';
import * as supertest from 'supertest';

describe('Training Routine (e2e) - Smoke Test', () => {
  let app: INestApplication;
  let req: supertest.SuperAgentTest;

  beforeAll(async () => {
    const testingApp = await createTestingApp();
    app = testingApp.app;
    req = testingApp.agent;
  });

  afterAll(async () => {
    await app.close();
  });

  it('POST /routines — creates a routine successfully (happy path)', async () => {
    // Register and login to get auth cookies
    await req
      .post('/auth/register')
      .send({
        email: 'test@routine.com',
        username: 'testroutine',
        password: 'Password123',
      })
      .expect(201);

    const response = await req
      .post('/routines')
      .send({ name: 'Test Routine', dayOfWeeks: ['monday'] })
      .expect(201);

    expect(response.body).toMatchObject({
      name: 'Test Routine',
      isActive: true,
      days: [{ dayOfWeek: 'monday', exercises: [] }],
    });
    const body = response.body as Record<string, unknown>;
    expect(body.id).toBeDefined();
    expect(body.createdAt).toBeDefined();
    expect(body.updatedAt).toBeDefined();
  });
});
