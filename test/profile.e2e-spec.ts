import { INestApplication } from '@nestjs/common';
import { createTestingApp } from './testing-module';
import * as supertest from 'supertest';

describe('Profile / Onboarding (e2e)', () => {
  let app: INestApplication;
  let req: supertest.SuperAgentTest;
  let authCookies: string;

  beforeAll(async () => {
    const testingApp = await createTestingApp();
    app = testingApp.app;
    req = testingApp.agent;
  });

  afterAll(async () => {
    await app.close();
  });

  // Helper to register and login a fresh user
  async function registerAndLogin(
    email: string,
    username: string,
  ): Promise<void> {
    await req
      .post('/auth/register')
      .send({
        email,
        username,
        password: process.env.TEST_USER_PASSWORD ?? 'TestPass123!',
      })
      .expect(201);
  }

  describe('RF-06 | Onboarding — Happy Path', () => {
    it('POST /onboarding/profile — creates profile with all required fields', async () => {
      const email = 'onboarding1@test.com';
      const username = 'onboarding1';
      await registerAndLogin(email, username);

      const response = await req
        .post('/onboarding/profile')
        .send({
          fullName: 'John Doe',
          birthDate: '1990-05-15',
          gender: 'male',
          weight: 75.5,
          height: 180,
          experienceLevel: 'intermediate',
          mainGoal: 'gain_muscle',
          daysAvailablePerWeek: 4,
          weightUnit: 'kg',
        })
        .expect(200);

      expect(response.body).toMatchObject({
        fullName: 'John Doe',
        birthDate: '1990-05-15',
        gender: 'male',
        weight: 75.5,
        height: 180,
        experienceLevel: 'intermediate',
        mainGoal: 'gain_muscle',
        daysAvailablePerWeek: 4,
        weightUnit: 'kg',
        onboardingCompleted: true,
      });
      expect(response.body.id).toBeDefined();
      expect(response.body.userId).toBeDefined();
      expect(response.body.createdAt).toBeDefined();
      expect(response.body.updatedAt).toBeDefined();
    });

    it('POST /onboarding/profile — uses default values when optional fields omitted', async () => {
      const email = 'onboarding2@test.com';
      const username = 'onboarding2';
      await registerAndLogin(email, username);

      const response = await req
        .post('/onboarding/profile')
        .send({
          fullName: 'Jane Doe',
          birthDate: '1995-08-20',
          gender: 'female',
          weight: 62,
          height: 165,
          experienceLevel: 'beginner',
          mainGoal: 'lose_weight',
        })
        .expect(200);

      expect(response.body).toMatchObject({
        fullName: 'Jane Doe',
        daysAvailablePerWeek: 3,
        weightUnit: 'kg',
        onboardingCompleted: true,
      });
    });

    it('GET /profile — returns the created profile', async () => {
      const email = 'onboarding3@test.com';
      const username = 'onboarding3';
      await registerAndLogin(email, username);

      await req
        .post('/onboarding/profile')
        .send({
          fullName: 'Alice Smith',
          birthDate: '1988-12-01',
          gender: 'other',
          weight: 70,
          height: 175,
          experienceLevel: 'advanced',
          mainGoal: 'maintain',
          daysAvailablePerWeek: 5,
          weightUnit: 'lbs',
        })
        .expect(200);

      const response = await req.get('/profile').expect(200);

      expect(response.body).toMatchObject({
        fullName: 'Alice Smith',
        birthDate: '1988-12-01',
        gender: 'other',
        weight: 70,
        height: 175,
        experienceLevel: 'advanced',
        mainGoal: 'maintain',
        daysAvailablePerWeek: 5,
        weightUnit: 'lbs',
        onboardingCompleted: true,
      });
    });

    it('GET /onboarding/status — returns completed true after profile creation', async () => {
      const email = 'onboarding4@test.com';
      const username = 'onboarding4';
      await registerAndLogin(email, username);

      await req
        .post('/onboarding/profile')
        .send({
          fullName: 'Bob Wilson',
          birthDate: '1992-03-10',
          gender: 'male',
          weight: 85,
          height: 190,
          experienceLevel: 'beginner',
          mainGoal: 'general_fitness',
        })
        .expect(200);

      const response = await req.get('/onboarding/status').expect(200);

      expect(response.body).toEqual({ completed: true });
    });
  });

  describe('RF-06 | Onboarding — Update (upsert)', () => {
    it('POST /onboarding/profile — updates existing profile', async () => {
      const email = 'onboarding5@test.com';
      const username = 'onboarding5';
      await registerAndLogin(email, username);

      // Create initial profile
      const createResponse = await req
        .post('/onboarding/profile')
        .send({
          fullName: 'Initial Name',
          birthDate: '1990-01-01',
          gender: 'male',
          weight: 80,
          height: 180,
          experienceLevel: 'beginner',
          mainGoal: 'lose_weight',
        })
        .expect(200);

      const initialId = createResponse.body.id;

      // Update profile
      const updateResponse = await req
        .post('/onboarding/profile')
        .send({
          fullName: 'Updated Name',
          birthDate: '1990-01-01',
          gender: 'male',
          weight: 78,
          height: 180,
          experienceLevel: 'intermediate',
          mainGoal: 'gain_muscle',
          daysAvailablePerWeek: 6,
          weightUnit: 'lbs',
        })
        .expect(200);

      expect(updateResponse.body.id).toBe(initialId);
      expect(updateResponse.body.fullName).toBe('Updated Name');
      expect(updateResponse.body.weight).toBe(78);
      expect(updateResponse.body.experienceLevel).toBe('intermediate');
      expect(updateResponse.body.mainGoal).toBe('gain_muscle');
      expect(updateResponse.body.daysAvailablePerWeek).toBe(6);
      expect(updateResponse.body.weightUnit).toBe('lbs');
      expect(updateResponse.body.onboardingCompleted).toBe(true);

      // Verify via GET
      const getResponse = await req.get('/profile').expect(200);

      expect(getResponse.body.fullName).toBe('Updated Name');
    });
  });

  describe('RF-06 | Onboarding — Validation Errors', () => {
    it('POST /onboarding/profile — rejects missing required fields', async () => {
      const email = 'onboarding6@test.com';
      const username = 'onboarding6';
      await registerAndLogin(email, username);

      const response = await req
        .post('/onboarding/profile')
        .send({
          fullName: 'Test User',
          // Missing: birthDate, gender, weight, height, experienceLevel, mainGoal
        })
        .expect(400);

      expect(response.body.message).toBeDefined();
    });

    it('POST /onboarding/profile — rejects invalid gender', async () => {
      const email = 'onboarding7@test.com';
      const username = 'onboarding7';
      await registerAndLogin(email, username);

      const response = await req
        .post('/onboarding/profile')
        .send({
          fullName: 'Test User',
          birthDate: '1990-01-01',
          gender: 'invalid_gender',
          weight: 70,
          height: 175,
          experienceLevel: 'beginner',
          mainGoal: 'lose_weight',
        })
        .expect(400);

      expect(response.body.message).toBeDefined();
    });

    it('POST /onboarding/profile — rejects invalid experienceLevel', async () => {
      const email = 'onboarding8@test.com';
      const username = 'onboarding8';
      await registerAndLogin(email, username);

      const response = await req
        .post('/onboarding/profile')
        .send({
          fullName: 'Test User',
          birthDate: '1990-01-01',
          gender: 'male',
          weight: 70,
          height: 175,
          experienceLevel: 'expert',
          mainGoal: 'lose_weight',
        })
        .expect(400);

      expect(response.body.message).toBeDefined();
    });

    it('POST /onboarding/profile — rejects invalid mainGoal', async () => {
      const email = 'onboarding9@test.com';
      const username = 'onboarding9';
      await registerAndLogin(email, username);

      const response = await req
        .post('/onboarding/profile')
        .send({
          fullName: 'Test User',
          birthDate: '1990-01-01',
          gender: 'male',
          weight: 70,
          height: 175,
          experienceLevel: 'beginner',
          mainGoal: 'become_superhero',
        })
        .expect(400);

      expect(response.body.message).toBeDefined();
    });

    it('POST /onboarding/profile — rejects invalid weight (negative)', async () => {
      const email = 'onboarding10@test.com';
      const username = 'onboarding10';
      await registerAndLogin(email, username);

      const response = await req
        .post('/onboarding/profile')
        .send({
          fullName: 'Test User',
          birthDate: '1990-01-01',
          gender: 'male',
          weight: -70,
          height: 175,
          experienceLevel: 'beginner',
          mainGoal: 'lose_weight',
        })
        .expect(400);

      expect(response.body.message).toBeDefined();
    });

    it('POST /onboarding/profile — rejects daysAvailablePerWeek out of range', async () => {
      const email = 'onboarding11@test.com';
      const username = 'onboarding11';
      await registerAndLogin(email, username);

      const response = await req
        .post('/onboarding/profile')
        .send({
          fullName: 'Test User',
          birthDate: '1990-01-01',
          gender: 'male',
          weight: 70,
          height: 175,
          experienceLevel: 'beginner',
          mainGoal: 'lose_weight',
          daysAvailablePerWeek: 10,
        })
        .expect(400);

      expect(response.body.message).toBeDefined();
    });

    it('POST /onboarding/profile — rejects invalid weightUnit', async () => {
      const email = 'onboarding12@test.com';
      const username = 'onboarding12';
      await registerAndLogin(email, username);

      const response = await req
        .post('/onboarding/profile')
        .send({
          fullName: 'Test User',
          birthDate: '1990-01-01',
          gender: 'male',
          weight: 70,
          height: 175,
          experienceLevel: 'beginner',
          mainGoal: 'lose_weight',
          weightUnit: 'stones',
        })
        .expect(400);

      expect(response.body.message).toBeDefined();
    });
  });

  describe('RF-06 | Onboarding — Not Completed', () => {
    it('GET /profile — returns null when profile does not exist', async () => {
      const email = 'onboarding13@test.com';
      const username = 'onboarding13';
      await registerAndLogin(email, username);

      const response = await req.get('/profile').expect(200);

      expect(response.body).toBeNull();
    });

    it('GET /onboarding/status — returns completed false when profile does not exist', async () => {
      const email = 'onboarding14@test.com';
      const username = 'onboarding14';
      await registerAndLogin(email, username);

      const response = await req.get('/onboarding/status').expect(200);

      expect(response.body).toEqual({ completed: false });
    });
  });

  describe('RF-06 | Onboarding — Protected Endpoints', () => {
    it('POST /onboarding/profile — rejects unauthenticated requests', async () => {
      // Use a fresh agent without cookies
      const freshReq = supertest.agent(app.getHttpServer());

      const response = await freshReq
        .post('/onboarding/profile')
        .send({
          fullName: 'Test User',
          birthDate: '1990-01-01',
          gender: 'male',
          weight: 70,
          height: 175,
          experienceLevel: 'beginner',
          mainGoal: 'lose_weight',
        })
        .expect(401);

      expect(response.body.message).toBeDefined();
    });

    it('GET /profile — rejects unauthenticated requests', async () => {
      const freshReq = supertest.agent(app.getHttpServer());

      const response = await freshReq.get('/profile').expect(401);

      expect(response.body.message).toBeDefined();
    });

    it('GET /onboarding/status — rejects unauthenticated requests', async () => {
      const freshReq = supertest.agent(app.getHttpServer());

      const response = await freshReq.get('/onboarding/status').expect(401);

      expect(response.body.message).toBeDefined();
    });
  });
});
