import { INestApplication } from '@nestjs/common';
import { createTestingApp } from './testing-module';

describe('Training Routine (e2e) - Smoke Test', () => {
  let app: INestApplication;
  let request: ReturnType<typeof import('supertest')>;

  beforeAll(async () => {
    const testingApp = await createTestingApp();
    app = testingApp.app;
    request = testingApp.request;
  });

  afterAll(async () => {
    await app.close();
  });

  it('POST /routines — creates a routine successfully (happy path)', async () => {
    const response = await request
      .post('/routines')
      .send({ name: 'Test Routine', dayOfWeeks: ['monday'] })
      .expect(201);

    expect(response.body).toMatchObject({
      name: 'Test Routine',
      userId: '00000000-0000-0000-0000-000000000001',
      isActive: true,
      days: [{ dayOfWeek: 'monday', exercises: [] }],
    });
    const body = response.body as Record<string, unknown>;
    expect(body.id).toBeDefined();
    expect(body.createdAt).toBeDefined();
    expect(body.updatedAt).toBeDefined();
  });
});
