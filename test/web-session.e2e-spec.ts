import { INestApplication } from '@nestjs/common';
import { DataSource } from 'typeorm';
import request from 'supertest';
import { createAuthTestingApp } from './auth-testing-module';

jest.mock('jwks-rsa', () => () => ({}));

describe('Local web session contract (e2e)', () => {
  let app: INestApplication;
  let agent: request.SuperAgentTest;
  const origin = 'http://localhost:8081';
  const password = 'TestPass123!';

  beforeAll(async () => {
    process.env.WEB_ALLOWED_ORIGINS = origin;
    process.env.OAUTH_ALLOWED_RETURN_URLS = `${origin}/auth/google/callback`;
    const testing = await createAuthTestingApp();
    app = testing.app;
    agent = testing.agent;
  });

  afterAll(async () => {
    await app.close();
  });

  function cookieValue(cookies: string[], name: string): string {
    const cookie = cookies.find((item) => item.startsWith(`${name}=`));
    if (!cookie) throw new Error(`Missing ${name} cookie`);
    return cookie.split(';')[0].slice(name.length + 1);
  }

  it('uses HttpOnly web cookies, CSRF, refresh rotation, and logout', async () => {
    const register = await agent.post('/auth/register').set('Origin', origin)
      .send({ email: 'web@example.test', username: 'webtest', password }).expect(201);
    expect(register.body.accessToken).toBeUndefined();
    expect(register.body.refreshToken).toBeUndefined();
    const cookies = register.headers['set-cookie'] as unknown as string[];
    expect(cookies.find((item) => item.startsWith('access_token='))).toContain('HttpOnly');
    expect(cookies.find((item) => item.startsWith('refresh_token='))).toContain('HttpOnly');
    const csrf = cookieValue(cookies, 'csrf_token');
    const originalRefresh = cookieValue(cookies, 'refresh_token');
    const rows: { token: string }[] = await app.get(DataSource).query('SELECT token FROM refresh_tokens');
    expect(rows[0].token).not.toBe(originalRefresh);
    expect(rows[0].token).toMatch(/^[a-f0-9]{64}$/);

    await agent.get('/auth/me').set('Origin', origin).expect(200);
    await agent.post('/auth/refresh').set('Origin', origin).expect(403);
    await agent.post('/auth/refresh').set('Origin', 'http://localhost:8081.evil.test')
      .set('X-CSRF-Token', csrf).expect(403);
    const rotated = await agent.post('/auth/refresh').set('Origin', origin)
      .set('X-CSRF-Token', csrf).expect(200);
    expect(rotated.body).toEqual({ success: true });
    expect(cookieValue(rotated.headers['set-cookie'] as unknown as string[], 'refresh_token'))
      .not.toBe(originalRefresh);

    const newCsrf = cookieValue(rotated.headers['set-cookie'] as unknown as string[], 'csrf_token');
    await agent.post('/auth/logout').set('Origin', origin).set('X-CSRF-Token', newCsrf)
      .expect(200);
    await agent.get('/auth/me').set('Origin', origin).expect(401);
  });

  it('rejects replay and unlisted OAuth destinations', async () => {
    const login = await agent.post('/auth/login').set('Origin', origin)
      .send({ email: 'web@example.test', password }).expect(200);
    const cookies = login.headers['set-cookie'] as unknown as string[];
    const oldRefresh = cookieValue(cookies, 'refresh_token');
    const csrf = cookieValue(cookies, 'csrf_token');
    const rotated = await agent.post('/auth/refresh').set('Origin', origin)
      .set('X-CSRF-Token', csrf).expect(200);
    await request(app.getHttpServer()).post('/auth/refresh').set('Origin', origin)
      .set('X-CSRF-Token', csrf)
      .set('Cookie', [`refresh_token=${oldRefresh}`, `csrf_token=${csrf}`])
      .expect(401);
    const newCsrf = cookieValue(rotated.headers['set-cookie'] as unknown as string[], 'csrf_token');
    await agent.post('/auth/refresh').set('Origin', origin)
      .set('X-CSRF-Token', newCsrf).expect(200);
    await request(app.getHttpServer()).get('/auth/google')
      .query({ returnTo: `${origin}.evil.test/auth/google/callback` }).expect(400);
  });

  it('keeps the winning refresh token valid after simultaneous rotation attempts', async () => {
    const login = await request(app.getHttpServer()).post('/auth/login').set('Origin', origin)
      .send({ email: 'web@example.test', password }).expect(200);
    const cookies = login.headers['set-cookie'] as unknown as string[];
    const oldRefresh = cookieValue(cookies, 'refresh_token');
    const csrf = cookieValue(cookies, 'csrf_token');
    const sendRefresh = () => request(app.getHttpServer()).post('/auth/refresh')
      .set('Origin', origin).set('X-CSRF-Token', csrf)
      .set('Cookie', [`refresh_token=${oldRefresh}`, `csrf_token=${csrf}`]);
    const responses = await Promise.all([sendRefresh(), sendRefresh()]);
    expect(responses.map((response) => response.status).sort()).toEqual([200, 401]);
    const winner = responses.find((response) => response.status === 200);
    if (!winner) throw new Error('No refresh request succeeded');
    const winningCookies = winner.headers['set-cookie'] as unknown as string[];
    const winningRefresh = cookieValue(winningCookies, 'refresh_token');
    const winningCsrf = cookieValue(winningCookies, 'csrf_token');
    await request(app.getHttpServer()).post('/auth/refresh').set('Origin', origin)
      .set('X-CSRF-Token', winningCsrf)
      .set('Cookie', [`refresh_token=${winningRefresh}`, `csrf_token=${winningCsrf}`])
      .expect(200);
  });

  it('preserves mobile bearer responses without setting web cookies', async () => {
    const login = await request(app.getHttpServer()).post('/auth/login')
      .set('X-Client-Type', 'mobile').send({ email: 'web@example.test', password })
      .expect(200);
    expect(login.body.accessToken).toEqual(expect.any(String));
    expect(login.body.refreshToken).toEqual(expect.any(String));
    expect(login.headers['set-cookie']).toBeUndefined();
    await request(app.getHttpServer()).get('/auth/me')
      .set('Authorization', `Bearer ${login.body.accessToken}`).expect(200);
    const refreshed = await request(app.getHttpServer()).post('/auth/refresh')
      .set('X-Client-Type', 'mobile')
      .send({ refreshToken: login.body.refreshToken }).expect(200);
    expect(refreshed.body.accessToken).toEqual(expect.any(String));
    expect(refreshed.body.refreshToken).toEqual(expect.any(String));
    expect(refreshed.headers['set-cookie']).toBeUndefined();
    const logout = await request(app.getHttpServer()).post('/auth/logout')
      .set('X-Client-Type', 'mobile')
      .set('Authorization', `Bearer ${refreshed.body.accessToken}`)
      .send({ refreshToken: refreshed.body.refreshToken }).expect(200);
    expect(logout.headers['set-cookie']).toBeUndefined();
    await request(app.getHttpServer()).post('/auth/refresh')
      .set('X-Client-Type', 'mobile')
      .send({ refreshToken: refreshed.body.refreshToken }).expect(401);
  });

  it('does not let a browser request select the mobile token response', async () => {
    const login = await request(app.getHttpServer()).post('/auth/login')
      .set('Origin', origin).set('X-Client-Type', 'mobile')
      .send({ email: 'web@example.test', password }).expect(200);
    expect(login.body.accessToken).toBeUndefined();
    expect(login.body.refreshToken).toBeUndefined();
    expect(login.headers['set-cookie']).toBeDefined();
  });
});
