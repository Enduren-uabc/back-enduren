// Created by: Codex (AI-assisted), 2026-10-18
import { randomBytes, randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { execFile } from 'node:child_process';
import { join } from 'node:path';
import { promisify } from 'node:util';
import { DataSource } from 'typeorm';
import type { PostgresConnectionOptions } from 'typeorm/driver/postgres/PostgresConnectionOptions';
import { buildRtF04Example } from '../../fixtures/rt-f04.fixture';
import { stableSerialize } from '../../domain/contract';
import { createCaseStateSnapshot } from '../../domain/case-state';
import { createKnowledgeRelease } from '../../domain/knowledge-release';
import {
  buildContextPacket,
  contentHash,
} from '../../application/context-intelligence';
import { buildPromptEnvelope } from '../../application/prompt-envelope';
import type {
  AttemptGuard,
  RegisterRunInput,
} from '../../application/run-persistence.port';
import type { GenerationRun } from '../../domain/generation-run';
import { prepareRegistration } from '../../application/persisted-artifacts';
import { PostgresRunStore } from './postgres-run-store';
import {
  CaseSnapshotRecord,
  ContextPacketRecord,
  RESEARCH_ENTITIES,
} from './research-records';
import { ResearchRunPersistence1792368000000 } from './migrations/1792368000000-ResearchRunPersistence';

// Deliberately opt-in: never reads the application's .env or connects to an operational database.
const configPath = process.env.RESEARCH_AI_TEST_DB_CONFIG;
const postgres = configPath ? describe : describe.skip;

function request(
  key = randomUUID(),
  uniqueArtifacts = false,
): RegisterRunInput {
  const f = buildRtF04Example();
  const snapshot = uniqueArtifacts
    ? { ...f.snapshot, snapshotId: `snapshot-${key}` }
    : f.snapshot;
  const knowledge = uniqueArtifacts
    ? createKnowledgeRelease({
        ...f.knowledge,
        ref: { id: `knowledge-${key}`, version: 'fixture-v1' },
      })
    : f.knowledge;
  const context = buildContextPacket(
    snapshot,
    knowledge,
    f.packet.content.policy,
  );
  const { ref, task, directives } = f.envelope.payload.instructions;
  const envelope = buildPromptEnvelope(context, { ref, task, directives });
  return {
    snapshot,
    knowledge,
    context,
    envelope,
    idempotency: { scope: 'synthetic-tests', key },
    configuration: {
      schemaVersion: 'generation-run-config/0.1',
      workflow: { id: 'rt-workflow', version: 's1b-test' },
      target: {
        providerId: 'unconfigured',
        modelId: 'unconfigured',
        maxOutputTokens: 1024,
        temperature: 0,
      },
    },
  };
}
function guard(run: GenerationRun): AttemptGuard {
  if (!run.attemptId) throw new Error('Test requires an active attempt');
  return { runId: run.runId, revision: run.revision, attemptId: run.attemptId };
}

postgres('S1B PostgreSQL real constraints and transactions', () => {
  let admin: DataSource;
  let app: DataSource;
  let options: PostgresConnectionOptions;
  let store: PostgresRunStore;
  const appRole = `s1b_test_${randomBytes(8).toString('hex')}`;

  beforeAll(async () => {
    const config = JSON.parse(readFileSync(configPath!, 'utf8')) as {
      host: string;
      port: number;
      database: string;
      username: string;
      password: string;
    };
    if (config.host !== '127.0.0.1' || config.database !== 'rg_das_s1b_test') {
      throw new Error(
        'Refusing a database outside the disposable S1B test boundary',
      );
    }
    options = {
      type: 'postgres',
      ...config,
      entities: RESEARCH_ENTITIES,
      migrations: [ResearchRunPersistence1792368000000],
      migrationsTableName: 's1b_test_migrations',
      synchronize: false,
      logging: false,
    };
    admin = await new DataSource(options).initialize();
    await admin.runMigrations({ transaction: 'all' });
    // Prove rollback/reapply on the isolated schema before persisting any fixture.
    await admin.undoLastMigration({ transaction: 'all' });
    await admin.runMigrations({ transaction: 'all' });
    const password = randomBytes(32).toString('hex');
    // Identifiers and this password are generated hex, never supplied by a test input.
    await admin.query(`CREATE ROLE ${appRole} LOGIN PASSWORD '${password}'`);
    await admin.query(`GRANT USAGE ON SCHEMA research_ai TO ${appRole}`);
    await admin.query(`GRANT SELECT, INSERT ON research_ai.case_snapshots, research_ai.knowledge_releases,
      research_ai.context_packets, research_ai.prompt_envelopes TO ${appRole}`);
    await admin.query(
      `GRANT SELECT, INSERT, UPDATE ON research_ai.generation_runs TO ${appRole}`,
    );
    await admin.query(`GRANT SELECT ON research_ai.run_events TO ${appRole}`);
    app = await new DataSource({
      ...options,
      username: appRole,
      password,
    }).initialize();
    store = new PostgresRunStore(app);
  }, 30_000);

  afterAll(async () => {
    if (app?.isInitialized) await app.destroy();
    if (admin?.isInitialized) {
      await admin.undoLastMigration({ transaction: 'all' });
      await admin.query(`DROP ROLE IF EXISTS ${appRole}`);
      await admin.destroy();
    }
  }, 30_000);

  it('saves, recovers and replays all four S1A artifacts exactly with a technical event', async () => {
    const input = request();
    const run = await store.registerRun(input);
    expect(run.status).toBe('PENDING');
    const loaded = await store.getRun(run.runId);
    for (const name of [
      'snapshot',
      'knowledge',
      'context',
      'envelope',
    ] as const) {
      expect(stableSerialize(loaded[name])).toBe(stableSerialize(input[name]));
    }
    expect(loaded.run).toEqual(run);
    expect(loaded.events.map((e) => e.kind)).toEqual(['REGISTERED']);
    expect(Object.isFrozen(loaded.envelope.payload)).toBe(true);
  });

  it('reconstructs committed state after closing every application connection', async () => {
    const run = await store.registerRun(request());
    const before = await store.getRun(run.runId);
    await app.destroy();
    await app.initialize();
    store = new PostgresRunStore(app);
    expect(await store.getRun(run.runId)).toEqual(before);
  });

  it('reconstructs identical committed evidence in a new backend process with no shared memory', async () => {
    const run = await store.registerRun(request());
    const expected = await store.getRun(run.runId);
    const result = await promisify(execFile)(
      process.execPath,
      [
        '-r',
        'ts-node/register/transpile-only',
        join(__dirname, 'fixtures/read-run.process.ts'),
        run.runId,
      ],
      { timeout: 15_000, maxBuffer: 1_048_576 },
    );
    expect(JSON.parse(result.stdout) as unknown).toEqual(expected);
  }, 20_000);

  it('persists the unextended S1A v0 snapshot without inventing extension fields', async () => {
    const input = request(randomUUID(), true);
    const equipment = input.snapshot.fields.availableEquipment;
    const snapshot = createCaseStateSnapshot({
      ...input.snapshot,
      fields: {
        ...input.snapshot.fields,
        availableEquipment:
          equipment.state === 'KNOWN'
            ? { ...equipment, value: [...equipment.value] }
            : equipment,
      },
    });
    const context = buildContextPacket(
      snapshot,
      input.knowledge,
      input.context.content.policy,
    );
    const { ref, task, directives } = input.envelope.payload.instructions;
    const run = await store.registerRun({
      ...input,
      snapshot,
      context,
      envelope: buildPromptEnvelope(context, { ref, task, directives }),
    });
    expect((await store.getRun(run.runId)).snapshot).toEqual(snapshot);
    expect((await store.getCaseSnapshot(run.snapshotHash)).schemaVersion).toBe(
      'research-case-v0',
    );
  });

  it('serializes eight concurrent duplicate registrations into one run and one event', async () => {
    const input = request();
    const runs = await Promise.all(
      Array.from({ length: 8 }, () => store.registerRun(input)),
    );
    expect(new Set(runs.map((run) => run.runId)).size).toBe(1);
    expect((await store.getRun(runs[0].runId)).events).toHaveLength(1);
  });

  it('rejects idempotency reuse with changed configuration without modifying the original', async () => {
    const input = request();
    const run = await store.registerRun(input);
    await expect(
      store.registerRun({
        ...input,
        configuration: {
          ...input.configuration,
          target: { ...input.configuration.target, temperature: 1 },
        },
      }),
    ).rejects.toMatchObject({ code: 'IDEMPOTENCY_CONFLICT' });
    expect((await store.getRun(run.runId)).run).toEqual(run);
  });

  it('makes competing payloads on one idempotency key resolve to one winner and an explicit conflict', async () => {
    const input = request();
    const changed = {
      ...input,
      configuration: {
        ...input.configuration,
        target: { ...input.configuration.target, temperature: 1 },
      },
    };
    const outcomes = await Promise.allSettled([
      store.registerRun(input),
      store.registerRun(changed),
    ]);
    expect(outcomes.filter((r) => r.status === 'fulfilled')).toHaveLength(1);
    const rejected = outcomes.find((r) => r.status === 'rejected');
    expect(
      rejected?.status === 'rejected'
        ? (rejected.reason as unknown)
        : undefined,
    ).toMatchObject({ code: 'IDEMPOTENCY_CONFLICT' });
  });

  it('rejects reusing an immutable snapshot identity with different content', async () => {
    const input = request(randomUUID(), true);
    await store.registerRun(input);
    const snapshot = {
      ...input.snapshot,
      capturedAt: '2001-01-01T00:00:00.000Z',
    };
    const context = buildContextPacket(
      snapshot,
      input.knowledge,
      input.context.content.policy,
    );
    const { ref, task, directives } = input.envelope.payload.instructions;
    await expect(
      store.registerRun({
        ...input,
        idempotency: { ...input.idempotency, key: randomUUID() },
        snapshot,
        context,
        envelope: buildPromptEnvelope(context, { ref, task, directives }),
      }),
    ).rejects.toMatchObject({ code: 'IDENTITY_CONFLICT' });
  });

  it.each([
    'case_snapshots',
    'knowledge_releases',
    'context_packets',
    'prompt_envelopes',
    'run_events',
  ])(
    'rejects direct UPDATE/DELETE/TRUNCATE of %s even with the migration owner',
    async (table) => {
      await store.registerRun(request());
      const column = table === 'run_events' ? 'kind' : 'canonical';
      for (const sql of [
        `UPDATE research_ai.${table} SET ${column} = ${column}`,
        `DELETE FROM research_ai.${table}`,
        `TRUNCATE research_ai.${table} CASCADE`,
      ]) {
        await expect(admin.query(sql)).rejects.toMatchObject({
          driverError: { code: '23514' },
        });
      }
    },
  );

  it('rejects hash mismatches, foreign references and direct event injection in PostgreSQL', async () => {
    const input = request(randomUUID(), true);
    const snapshots = admin.getRepository(CaseSnapshotRecord);
    await expect(
      snapshots.insert({
        hash: '0'.repeat(64),
        canonical: stableSerialize(input.snapshot),
        snapshotId: input.snapshot.snapshotId,
        caseId: input.snapshot.caseId,
      }),
    ).rejects.toMatchObject({ driverError: { code: '23514' } });
    const prepared = prepareRegistration(input);
    await expect(
      admin.getRepository(ContextPacketRecord).insert({
        hash: prepared.hashes.contextHash,
        canonical: stableSerialize(input.context),
        packetId: input.context.packetId,
        snapshotHash: prepared.hashes.snapshotHash,
        knowledgeHash: prepared.hashes.knowledgeHash,
      }),
    ).rejects.toMatchObject({ driverError: { code: '23514' } });
    const run = await store.registerRun(request());
    await expect(
      app.query(
        'INSERT INTO research_ai.run_events(run_id,revision,kind,to_status,occurred_at) VALUES ($1,99,$2,$3,now())',
        [run.runId, 'FAILED', 'FAILED'],
      ),
    ).rejects.toMatchObject({ driverError: { code: '42501' } });
  });

  it('detects a self-consistently hashed but forged selected case value during read', async () => {
    const input = request();
    await store.registerRun(input);
    const content = {
      ...input.context.content,
      caseFields: input.context.content.caseFields.map((entry) =>
        entry.path === 'goal'
          ? { ...entry, field: { ...entry.field, value: 'forged-value' } }
          : entry,
      ),
    };
    const hash = contentHash(content);
    const packet = {
      ...input.context,
      content,
      contentHash: hash,
      packetId: `ctx-${hash}`,
      contentBytes: Buffer.byteLength(stableSerialize(content), 'utf8'),
    };
    const artifactHash = contentHash(packet);
    const contexts = admin.getRepository(ContextPacketRecord);
    await contexts.insert({
      hash: artifactHash,
      canonical: stableSerialize(packet),
      packetId: packet.packetId,
      snapshotHash: input.context.content.caseRef.snapshotHash,
      knowledgeHash: input.context.content.knowledgeReleaseHash,
    });
    await expect(store.getContextPacket(artifactHash)).rejects.toMatchObject({
      code: 'INTEGRITY_VIOLATION',
    });
  });

  it('rolls back all newly inserted artifacts when the final event insertion fails', async () => {
    const input = request(randomUUID(), true);
    await admin.query(`CREATE FUNCTION research_ai.test_abort_event() RETURNS trigger LANGUAGE plpgsql AS $$
      BEGIN RAISE EXCEPTION 'injected test failure'; END $$;
      CREATE TRIGGER test_abort_event BEFORE INSERT ON research_ai.run_events
      FOR EACH ROW EXECUTE FUNCTION research_ai.test_abort_event()`);
    try {
      const failure: unknown = await store
        .registerRun(input)
        .catch((error: unknown) => error);
      expect(failure).toMatchObject({
        code: 'STORAGE_FAILURE',
        sqlState: 'P0001',
      });
      expect(failure).not.toHaveProperty('query');
      expect(failure).not.toHaveProperty('parameters');
      expect(failure).not.toHaveProperty('driverError');
      expect(JSON.stringify(failure)).not.toContain(input.snapshot.snapshotId);
    } finally {
      await admin.query(
        'DROP TRIGGER test_abort_event ON research_ai.run_events; DROP FUNCTION research_ai.test_abort_event()',
      );
    }
    const hashes = prepareRegistration(input).hashes;
    await expect(
      store.getCaseSnapshot(hashes.snapshotHash),
    ).rejects.toMatchObject({ code: 'NOT_FOUND' });
    await expect(
      store.getKnowledgeRelease(hashes.knowledgeHash),
    ).rejects.toMatchObject({ code: 'NOT_FOUND' });
    await expect(
      store.getContextPacket(hashes.contextHash),
    ).rejects.toMatchObject({ code: 'NOT_FOUND' });
    await expect(
      store.getPromptEnvelope(hashes.envelopeHash),
    ).rejects.toMatchObject({ code: 'NOT_FOUND' });
    expect((await store.registerRun(input)).status).toBe('PENDING');
  });

  it('allows exactly one concurrent claim and makes it visible on another connection before dispatch', async () => {
    const pending = await store.registerRun(request());
    const claims = await Promise.allSettled(
      Array.from({ length: 6 }, () => store.claimRun(pending.runId, 0, 30)),
    );
    expect(claims.filter((r) => r.status === 'fulfilled')).toHaveLength(1);
    const loaded = await new PostgresRunStore(admin).getRun(pending.runId);
    expect(loaded.run.status).toBe('RUNNING');
    expect(loaded.events.map((e) => e.kind)).toEqual(['REGISTERED', 'CLAIMED']);
    const activeTransactions: { count: string }[] = await admin.query(
      "SELECT count(*) FROM pg_stat_activity WHERE usename = $1 AND state = 'idle in transaction'",
      [appRole],
    );
    expect(activeTransactions[0].count).toBe('0');
  });

  it('keeps idempotent reads coherent when a claim commits concurrently', async () => {
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const input = request();
      const pending = await store.registerRun(input);
      const outcomes = await Promise.all([
        store.registerRun(input),
        store.claimRun(pending.runId, 0, 30),
        store.getRun(pending.runId),
      ]);
      expect(outcomes[0].runId).toBe(pending.runId);
      expect(outcomes[1].status).toBe('RUNNING');
      expect(outcomes[2].events.length).toBe(outcomes[2].run.revision + 1);
    }
  });

  it('records provider identity and known failure; explicit retry invalidates the old attempt', async () => {
    const pending = await store.registerRun(request());
    const first = await store.claimRun(pending.runId, 0, 30);
    const referenced = await store.recordProviderReference(
      guard(first),
      'synthetic-request-1',
    );
    await expect(
      store.failRun(guard(first), {
        code: 'PROVIDER_REJECTED',
        phase: 'PROVIDER',
        retryable: true,
      }),
    ).rejects.toMatchObject({ code: 'STALE_EXECUTION' });
    const failed = await store.failRun(guard(referenced), {
      code: 'PROVIDER_REJECTED',
      phase: 'PROVIDER',
      retryable: true,
    });
    const retried = await store.retryFailedRun(failed.runId, failed.revision);
    const second = await store.claimRun(retried.runId, retried.revision, 30);
    expect(second.attemptNumber).toBe(2);
    expect(second.attemptId).not.toBe(first.attemptId);
    await expect(
      store.recordProviderReference(
        { ...guard(first), revision: second.revision },
        'synthetic-stale',
      ),
    ).rejects.toMatchObject({ code: 'STALE_EXECUTION' });
    expect(
      (await store.getRun(second.runId)).events.map((e) => e.kind),
    ).toEqual([
      'REGISTERED',
      'CLAIMED',
      'PROVIDER_REFERENCED',
      'FAILED',
      'RETRY_SCHEDULED',
      'CLAIMED',
    ]);
  });

  it('blocks invalid transitions, mutable configuration, deletion and unsafe retries', async () => {
    const pending = await store.registerRun(request());
    await expect(
      admin.query(
        "UPDATE research_ai.generation_runs SET status = 'FAILED', revision = revision + 1 WHERE run_id = $1",
        [pending.runId],
      ),
    ).rejects.toMatchObject({ driverError: { code: '23514' } });
    await expect(
      admin.query(
        "UPDATE research_ai.generation_runs SET configuration_canonical = '{}', revision = revision + 1 WHERE run_id = $1",
        [pending.runId],
      ),
    ).rejects.toMatchObject({ driverError: { code: '23514' } });
    await expect(
      admin.query('DELETE FROM research_ai.generation_runs WHERE run_id = $1', [
        pending.runId,
      ]),
    ).rejects.toMatchObject({ driverError: { code: '23514' } });
    const active = await store.claimRun(pending.runId, 0, 30);
    await expect(
      store.failRun(guard(active), {
        code: 'UNEXPECTED_FAILURE',
        phase: 'PROVIDER',
        retryable: true,
      }),
    ).rejects.toMatchObject({ code: 'INVALID_INPUT' });
    const failed = await store.failRun(guard(active), {
      code: 'UNEXPECTED_FAILURE',
      phase: 'PROVIDER',
      retryable: false,
    });
    await expect(
      store.retryFailedRun(failed.runId, failed.revision),
    ).rejects.toMatchObject({ code: 'INVALID_TRANSITION' });
  });

  it('recovers expired attempts after reconnection without automatically dispatching them again', async () => {
    const pending = await store.registerRun(request());
    const active = await store.claimRun(pending.runId, 0, 1);
    await admin.query('SELECT pg_sleep(1.1)');
    await expect(
      store.failRun(guard(active), {
        code: 'UNEXPECTED_FAILURE',
        phase: 'PROVIDER',
        retryable: false,
      }),
    ).rejects.toMatchObject({ code: 'STALE_EXECUTION' });
    await app.destroy();
    await app.initialize();
    store = new PostgresRunStore(app);
    const recovered = await Promise.all([
      store.recoverExpired(100),
      store.recoverExpired(100),
    ]);
    expect(recovered.flat().filter((id) => id === active.runId)).toHaveLength(
      1,
    );
    const result = await store.getRun(active.runId);
    expect(result.run.status).toBe('INTERRUPTED');
    expect(result.run.error).toEqual({
      code: 'LEASE_EXPIRED',
      phase: 'PROVIDER',
      retryable: false,
    });
    expect(result.events.at(-1)?.kind).toBe('INTERRUPTED');
    await expect(
      store.retryFailedRun(result.run.runId, result.run.revision),
    ).rejects.toMatchObject({ code: 'INVALID_TRANSITION' });
  });

  it('bounds pending and recovery queries and never treats the idempotency scope as authorization', async () => {
    const pending = await store.registerRun(request());
    expect(await store.listPending(100)).toContain(pending.runId);
    expect(await store.listPending(1)).toHaveLength(1);
    await expect(store.listPending(101)).rejects.toMatchObject({
      code: 'INVALID_INPUT',
    });
    await expect(store.recoverExpired(0)).rejects.toMatchObject({
      code: 'INVALID_INPUT',
    });
  });
});
