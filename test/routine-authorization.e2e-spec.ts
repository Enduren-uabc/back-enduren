import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { createAuthTestingApp } from './auth-testing-module';
import { UserTypeormEntity } from '../src/modules/users/infrastructure/persistence/typeorm/entities/user-typeorm.entity';

jest.mock('jwks-rsa', () => () => ({}));

describe('Routine authorization (e2e)', () => {
  let app: INestApplication;
  const password = 'TestPass123!';

  beforeAll(async () => {
    ({ app } = await createAuthTestingApp({ training: true }));
  });

  afterAll(async () => {
    if (app) await app.close();
  });

  async function tokenFor(
    name: string,
    role: 'user' | 'trainer' = 'user',
  ): Promise<string> {
    const response = await request(app.getHttpServer())
      .post('/auth/register')
      .set('X-Client-Type', 'mobile')
      .send({ email: `${name}@example.test`, username: name, password, role })
      .expect(201);
    return response.body.accessToken as string;
  }

  it('rejects a different user editing a routine and leaves the routine unchanged', async () => {
    const ownerToken = await tokenFor('routineowner');
    const otherToken = await tokenFor('routineother');
    const created = await request(app.getHttpServer())
      .post('/routines')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ name: 'Private routine', dayOfWeeks: ['monday'] })
      .expect(201);
    const routineId = created.body.id as string;

    await request(app.getHttpServer())
      .patch(`/routines/${routineId}/sync`)
      .set('Authorization', `Bearer ${otherToken}`)
      .send({ days: [{ dayOfWeek: 'monday', exercises: [] }] })
      .expect(403);

    const after = await request(app.getHttpServer())
      .get(`/routines/${routineId}`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .expect(200);
    expect(after.body.name).toBe('Private routine');
    expect(after.body.days).toEqual(created.body.days);
  });

  it('rejects a different user adding an exercise to a routine', async () => {
    const ownerToken = await tokenFor('exerciseowner');
    const otherToken = await tokenFor('exerciseother');
    const created = await request(app.getHttpServer())
      .post('/routines')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ name: 'Owner exercise routine', dayOfWeeks: ['monday'] })
      .expect(201);

    await request(app.getHttpServer())
      .post(`/routines/${created.body.id}/days/monday/exercises`)
      .set('Authorization', `Bearer ${otherToken}`)
      .send({ name: 'Intruder exercise' })
      .expect(403);

    const after = await request(app.getHttpServer())
      .get(`/routines/${created.body.id}`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .expect(200);
    expect(after.body.days[0].exercises).toEqual([]);
  });

  it('rejects another user across the routine editing endpoints', async () => {
    const ownerToken = await tokenFor('matrixowner');
    const otherToken = await tokenFor('matrixother');
    const created = await request(app.getHttpServer())
      .post('/routines')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ name: 'Matrix routine', dayOfWeeks: ['monday'] })
      .expect(201);
    const routineId = created.body.id as string;
    const added = await request(app.getHttpServer())
      .post(`/routines/${routineId}/days/monday/exercises`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ name: 'Owner exercise' })
      .expect(201);
    const exerciseId = added.body.days[0].exercises[0].id as string;
    const original = await request(app.getHttpServer())
      .get(`/routines/${routineId}`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .expect(200);

    const attempts: Array<{
      method: 'post' | 'patch' | 'delete';
      path: string;
      body?: object;
    }> = [
      {
        method: 'delete',
        path: `/routines/${routineId}/days/monday/exercises/${exerciseId}`,
      },
      {
        method: 'patch',
        path: `/routines/${routineId}/days/monday/exercises/${exerciseId}`,
        body: { sets: [] },
      },
      {
        method: 'patch',
        path: `/routines/${routineId}/name`,
        body: { name: 'Intruder name' },
      },
      { method: 'patch', path: `/routines/${routineId}/activate` },
      { method: 'patch', path: `/routines/${routineId}/deactivate` },
      { method: 'delete', path: `/routines/${routineId}/days/monday` },
      { method: 'delete', path: `/routines/${routineId}` },
      {
        method: 'patch',
        path: `/routines/${routineId}/sync`,
        body: { days: [{ dayOfWeek: 'monday', exercises: [] }] },
      },
      {
        method: 'patch',
        path: `/routines/${routineId}/training-strategy`,
        body: { strategyKey: null },
      },
      {
        method: 'post',
        path: `/routines/${routineId}/days/monday/fork`,
        body: {
          sourceWorkoutSessionId: '00000000-0000-4000-8000-000000000001',
        },
      },
    ];

    for (const attempt of attempts) {
      const call = request(app.getHttpServer())
        [attempt.method](attempt.path)
        .set('Authorization', `Bearer ${otherToken}`);
      const result = await call.send(attempt.body ?? {});
      expect([403, 404]).toContain(result.status);
    }

    const after = await request(app.getHttpServer())
      .get(`/routines/${routineId}`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .expect(200);
    expect(after.body).toMatchObject({
      name: original.body.name,
      isActive: original.body.isActive,
      days: original.body.days,
    });
  });

  it('rejects an owner without trainer role editing a client routine', async () => {
    const trainerToken = await tokenFor('downgradedtrainer', 'trainer');
    const created = await request(app.getHttpServer())
      .post('/routines')
      .set('Authorization', `Bearer ${trainerToken}`)
      .send({
        name: 'Client routine',
        dayOfWeeks: ['monday'],
        targetAudience: 'client',
      })
      .expect(201);

    await app
      .get(DataSource)
      .getRepository(UserTypeormEntity)
      .update({ email: 'downgradedtrainer@example.test' }, { role: 'user' });
    const login = await request(app.getHttpServer())
      .post('/auth/login')
      .set('X-Client-Type', 'mobile')
      .send({ email: 'downgradedtrainer@example.test', password })
      .expect(200);
    const userToken = login.body.accessToken as string;

    await request(app.getHttpServer())
      .patch(`/routines/${created.body.id}/name`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ name: 'Changed without trainer role' })
      .expect(403);

    const after = await request(app.getHttpServer())
      .get(`/routines/${created.body.id}`)
      .set('Authorization', `Bearer ${userToken}`)
      .expect(200);
    expect(after.body.name).toBe('Client routine');
  });

  it('requires an allowed Origin and CSRF token for a browser routine mutation', async () => {
    const origin = 'http://localhost:8081';
    process.env.WEB_ALLOWED_ORIGINS = origin;
    const browser = request.agent(app.getHttpServer());
    const registered = await browser
      .post('/auth/register')
      .set('Origin', origin)
      .send({
        email: 'webmutation@example.test',
        username: 'webmutation',
        password,
      })
      .expect(201);
    expect(registered.body.accessToken).toBeUndefined();
    const csrfCookie = (
      registered.headers['set-cookie'] as unknown as string[]
    ).find((cookie) => cookie.startsWith('csrf_token='));
    if (!csrfCookie) throw new Error('CSRF cookie missing');
    const csrf = csrfCookie.split(';')[0].slice('csrf_token='.length);
    const payload = { name: 'Browser routine', dayOfWeeks: ['monday'] };

    await browser
      .post('/routines')
      .set('Origin', origin)
      .send(payload)
      .expect(403);
    await browser
      .post('/routines')
      .set('Origin', `${origin}.evil.test`)
      .set('X-CSRF-Token', csrf)
      .send(payload)
      .expect(403);
    await browser
      .post('/routines')
      .set('Origin', origin)
      .set('X-CSRF-Token', csrf)
      .send(payload)
      .expect(201);
  });
});
