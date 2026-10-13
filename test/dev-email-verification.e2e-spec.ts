import { INestApplication } from '@nestjs/common';
import { DataSource } from 'typeorm';
import request from 'supertest';
import { createAuthTestingApp } from './auth-testing-module';

jest.mock('jwks-rsa', () => () => ({}));

const password = 'TestPass123!';

async function countVerificationTokens(app: INestApplication): Promise<number> {
  const rows: { count: number | string }[] = await app
    .get(DataSource)
    .query('SELECT COUNT(*) AS count FROM email_verification_tokens');
  return Number(rows[0].count);
}

describe('Email verification development bypass (e2e)', () => {
  describe('with AUTH_EMAIL_VERIFICATION_DISABLED=true', () => {
    let app: INestApplication;

    beforeAll(async () => {
      process.env.AUTH_EMAIL_VERIFICATION_DISABLED = 'true';
      ({ app } = await createAuthTestingApp());
    });

    afterAll(async () => {
      await app.close();
      delete process.env.AUTH_EMAIL_VERIFICATION_DISABLED;
    });

    it('registers, logs in and hydrates as verified without storing a token', async () => {
      const register = await request(app.getHttpServer())
        .post('/auth/register')
        .set('X-Client-Type', 'mobile')
        .send({
          email: 'dev-bypass@example.test',
          username: 'devbypass',
          password,
        })
        .expect(201);
      expect(register.body.emailVerified).toBe(true);
      expect(await countVerificationTokens(app)).toBe(0);

      const login = await request(app.getHttpServer())
        .post('/auth/login')
        .set('X-Client-Type', 'mobile')
        .send({ email: 'dev-bypass@example.test', password })
        .expect(200);
      expect(login.body.emailVerified).toBe(true);

      const me = await request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', `Bearer ${login.body.accessToken}`)
        .expect(200);
      expect(me.body.emailVerified).toBe(true);
    });

    it('accepts the hardcoded 000000 code', async () => {
      await request(app.getHttpServer())
        .post('/auth/verify-email')
        .send({ token: '000000' })
        .expect(200)
        .expect({ verified: true });
    });
  });

  describe('with AUTH_EMAIL_VERIFICATION_DISABLED=false', () => {
    let app: INestApplication;

    beforeAll(async () => {
      process.env.AUTH_EMAIL_VERIFICATION_DISABLED = 'false';
      ({ app } = await createAuthTestingApp());
    });

    afterAll(async () => {
      await app.close();
      delete process.env.AUTH_EMAIL_VERIFICATION_DISABLED;
    });

    it('keeps the real flow: unverified register and rejected fixed code', async () => {
      const register = await request(app.getHttpServer())
        .post('/auth/register')
        .set('X-Client-Type', 'mobile')
        .send({
          email: 'real-flow@example.test',
          username: 'realflow',
          password,
        })
        .expect(201);
      expect(register.body.emailVerified).toBe(false);
      expect(await countVerificationTokens(app)).toBe(1);

      const login = await request(app.getHttpServer())
        .post('/auth/login')
        .set('X-Client-Type', 'mobile')
        .send({ email: 'real-flow@example.test', password })
        .expect(200);
      expect(login.body.emailVerified).toBe(false);

      await request(app.getHttpServer())
        .post('/auth/verify-email')
        .send({ token: '000000' })
        .expect(400);
    });
  });
});
