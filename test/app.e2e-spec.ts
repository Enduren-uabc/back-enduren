import { INestApplication } from '@nestjs/common';
import { createTestingApp } from './testing-module';
import * as supertest from 'supertest';

describe('App (e2e) - Health check with SQLite', () => {
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

  it('application boots and training module responds', async () => {
    // Register and login to get auth cookies
    await req
      .post('/auth/register')
      .send({
        email: 'health@check.com',
        username: 'healthcheck',
        password: process.env.TEST_USER_PASSWORD ?? 'TestPass123!',
      })
      .expect(201);

    // Smoke test: the app boots with SQLite and the training module is available
    const response = await req
      .post('/routines')
      .send({ name: 'Health Check Routine', dayOfWeeks: ['monday'] })
      .expect(201);

    expect(response.body).toMatchObject({
      name: 'Health Check Routine',
      isActive: true,
    });
    expect(response.body.userId).toBeDefined();
    expect(response.body.userId).not.toBe(
      '00000000-0000-0000-0000-000000000001',
    );
  });
});
