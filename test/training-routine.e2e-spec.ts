import { INestApplication } from '@nestjs/common';
import { createTestingApp } from './testing-module';
import * as supertest from 'supertest';

describe('Training Routine (e2e)', () => {
  describe('POST /routines — happy path', () => {
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

    it('creates a routine successfully', async () => {
      await req
        .post('/auth/register')
        .send({
          email: 'test@routine.com',
          username: 'testroutine',
          password: process.env.TEST_USER_PASSWORD ?? 'TestPass123!',
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

  describe('POST /routines — 5-routine limit', () => {
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

    it('rejects 6th routine with ROUTINE_LIMIT_EXCEEDED', async () => {
      await req
        .post('/auth/register')
        .send({
          email: 'limit@routine.com',
          username: 'limitroutine',
          password: process.env.TEST_USER_PASSWORD ?? 'TestPass123!',
        })
        .expect(201);

      // Create 5 routines successfully
      for (let i = 1; i <= 5; i++) {
        await req
          .post('/routines')
          .send({ name: `Routine ${i}`, dayOfWeeks: ['monday'] })
          .expect(201);
      }

      // 6th routine should be rejected
      const response = await req
        .post('/routines')
        .send({ name: 'Routine 6', dayOfWeeks: ['monday'] })
        .expect(409);

      const body = response.body as Record<string, unknown>;
      expect(body.statusCode).toBe(409);
      expect(body.error).toBe('Conflict');
      expect(body.message).toContain('maximum of 5 routines');
    });
  });

  describe('POST /routines — duplicate name', () => {
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

    it('rejects duplicate routine name with ROUTINE_NAME_ALREADY_EXISTS', async () => {
      await req
        .post('/auth/register')
        .send({
          email: 'duplicate@routine.com',
          username: 'duplicateroutine',
          password: process.env.TEST_USER_PASSWORD ?? 'TestPass123!',
        })
        .expect(201);

      await req
        .post('/routines')
        .send({ name: 'Duplicate Routine', dayOfWeeks: ['monday'] })
        .expect(201);

      const response = await req
        .post('/routines')
        .send({ name: 'Duplicate Routine', dayOfWeeks: ['tuesday'] })
        .expect(409);

      const body = response.body as Record<string, unknown>;
      expect(body.statusCode).toBe(409);
      expect(body.error).toBe('Conflict');
      expect(body.message).toContain('already exists for this user');
    });
  });

  describe('POST /routines — missing required fields', () => {
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

    it('rejects missing name and dayOfWeeks with 400 from ValidationPipe', async () => {
      await req
        .post('/auth/register')
        .send({
          email: 'missing@routine.com',
          username: 'missingroutine',
          password: process.env.TEST_USER_PASSWORD ?? 'TestPass123!',
        })
        .expect(201);

      const response = await req.post('/routines').send({}).expect(400);

      const body = response.body as Record<string, unknown>;
      expect(body.statusCode).toBe(400);
      expect(body.error).toBe('Bad Request');
      expect(body.message).toBeDefined();
    });
  });
});
