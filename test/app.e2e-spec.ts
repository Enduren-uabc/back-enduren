import { INestApplication } from '@nestjs/common';
import { createTestingApp } from './testing-module';

describe('App (e2e) - Health check with SQLite', () => {
  let app: INestApplication;
  let req: ReturnType<typeof import('supertest')>;

  beforeAll(async () => {
    const testingApp = await createTestingApp();
    app = testingApp.app;
    req = testingApp.request;
  });

  afterAll(async () => {
    await app.close();
  });

  it('application boots and training module responds', async () => {
    // Smoke test: the app boots with SQLite and the training module is available
    const response = await req
      .post('/routines')
      .send({ name: 'Health Check Routine', dayOfWeeks: ['monday'] })
      .expect(201);

    expect(response.body).toMatchObject({
      name: 'Health Check Routine',
      userId: '00000000-0000-0000-0000-000000000001',
      isActive: true,
    });
  });
});
