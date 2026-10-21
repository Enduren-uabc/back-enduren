// Created by: Codex (AI-assisted), 2026-10-20
import { randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import https from 'node:https';
import { DataSource } from 'typeorm';
import { buildRtF04Example } from '../../fixtures/rt-f04.fixture';
import { stableSerialize } from '../../domain/contract';
import type {
  ExecutionRunConfiguration,
  GenerationRun,
} from '../../domain/generation-run';
import { contentHash } from '../../application/context-intelligence';
import { modelProfileHash } from '../../application/execution-policy';
import type {
  ExecutionAuthorization,
  ModelProfile,
} from '../../application/execution-policy';
import type { ModelResult } from '../../application/generation-execution-store.port';
import type { PreparedModelRequest } from '../../application/model-gateway.port';
import type {
  AttemptGuard,
  RegisterRunInput,
} from '../../application/run-persistence.port';
import {
  OpenAIResponsesGateway,
  OPENAI_RESPONSES_GATEWAY_VERSION,
} from '../openai/openai-responses-gateway';
import { encodeRTWire, OPENAI_RT_WIRE_VERSION } from '../openai/openai-rt-wire';
import { RESEARCH_ENTITIES } from './research-records';
import { PostgresRunStore } from './postgres-run-store';
import { PostgresGenerationExecutionStore } from './postgres-generation-execution-store';
import { ResearchRunPersistence1792368000000 } from './migrations/1792368000000-ResearchRunPersistence';
import { ResearchModelExecution1792454400000 } from './migrations/1792454400000-ResearchModelExecution';

const configPath = process.env.RESEARCH_AI_S1C_TEST_DB_CONFIG;
const postgres = configPath ? describe : describe.skip;
const fixture = buildRtF04Example();
function guard(run: GenerationRun): AttemptGuard {
  if (!run.attemptId) throw new Error('ACTIVE_ATTEMPT_REQUIRED');
  return { runId: run.runId, attemptId: run.attemptId, revision: run.revision };
}
postgres('S1C real PostgreSQL execution evidence and budget admission', () => {
  let source: DataSource;
  let runs: PostgresRunStore;
  let executions: PostgresGenerationExecutionStore;
  let profile: ModelProfile;
  let networkGuard: jest.SpyInstance;
  beforeAll(async () => {
    networkGuard = jest.spyOn(https, 'request').mockImplementation(() => {
      throw new Error('REAL_HTTP_FORBIDDEN');
    });
    const config = JSON.parse(readFileSync(configPath!, 'utf8')) as {
      host: string;
      port: number;
      database: string;
      username: string;
      password: string;
    };
    if (config.host !== '127.0.0.1' || config.database !== 'rg_das_s1c_test')
      throw new Error('DISPOSABLE_S1C_DATABASE_REQUIRED');
    source = await new DataSource({
      type: 'postgres',
      ...config,
      entities: RESEARCH_ENTITIES,
      migrations: [
        ResearchRunPersistence1792368000000,
        ResearchModelExecution1792454400000,
      ],
      migrationsTableName: 's1c_test_migrations',
      synchronize: false,
      logging: false,
    }).initialize();
    // This exact synthetic database is disposable; evidence guards intentionally
    // prevent row cleanup, so repeat runs recreate only this suite's schema.
    await source.query('DROP SCHEMA IF EXISTS research_ai CASCADE');
    await source.query('DROP TABLE IF EXISTS public.s1c_test_migrations');
    await source.runMigrations({ transaction: 'all' });
    // Both migrations revert and reapply before any durable execution evidence exists.
    await source.undoLastMigration({ transaction: 'all' });
    await source.undoLastMigration({ transaction: 'all' });
    await source.runMigrations({ transaction: 'all' });
    runs = new PostgresRunStore(source);
    executions = new PostgresGenerationExecutionStore(source);
    profile = {
      schemaVersion: 'model-profile/0.1',
      kind: 'SYNTHETIC_TEST',
      providerId: 'openai',
      modelId: 'offline-model',
      contextWindowTokens: 100000,
      maxOutputTokens: 2000,
      supportsResponses: true,
      supportsStructuredOutputs: true,
      supportsTemperature: false,
      inputMicrosPerMillionTokens: 1000000,
      outputMicrosPerMillionTokens: 1000000,
      capabilitySource: 'https://developers.openai.com/synthetic-test-only',
      pricingSource: 'https://developers.openai.com/synthetic-test-only',
      verifiedAt: new Date(Date.now() - 60000).toISOString(),
      expiresAt: new Date(Date.now() + 3600000).toISOString(),
    };
  }, 30000);
  afterAll(async () => {
    if (networkGuard) {
      expect(networkGuard).not.toHaveBeenCalled();
      networkGuard.mockRestore();
    }
    if (source?.isInitialized) await source.destroy();
  });
  function authorization(
    changes: Partial<ExecutionAuthorization> = {},
  ): ExecutionAuthorization {
    return {
      schemaVersion: 'execution-authorization/0.1',
      id: randomUUID(),
      scope: 'synthetic-execution-tests',
      profile,
      maxCalls: 5,
      budgetMicros: 1000000,
      expiresAt: profile.expiresAt,
      ...changes,
    };
  }
  async function setup(auth = authorization(), leaseSeconds = 30) {
    await executions.authorize(auth);
    const configuration: ExecutionRunConfiguration = {
      schemaVersion: 'generation-run-config/0.2',
      workflow: { id: 'rt-workflow', version: 's1c-offline' },
      target: {
        providerId: 'openai',
        modelId: auth.profile.modelId,
        maxOutputTokens: 2000,
        temperature: null,
      },
      execution: {
        authorizationId: auth.id,
        profileHash: modelProfileHash(auth.profile),
        gatewayVersion: OPENAI_RESPONSES_GATEWAY_VERSION,
        wireSchemaVersion: OPENAI_RT_WIRE_VERSION,
        maxInputTokens: 100000,
        maxRequestBytes: 1000000,
        maxResponseBytes: 1000000,
        timeoutMs: 1,
      },
    };
    const input: RegisterRunInput = {
      snapshot: fixture.snapshot,
      knowledge: fixture.knowledge,
      context: fixture.packet,
      envelope: fixture.envelope,
      idempotency: { scope: auth.scope, key: randomUUID() },
      configuration,
    };
    const pending = await runs.registerRun(input);
    const run = await runs.claimRun(
      pending.runId,
      pending.revision,
      leaseSeconds,
    );
    const prepared = new OpenAIResponsesGateway().prepare(
      fixture.envelope,
      configuration,
      auth.profile,
    );
    return { auth, run, guard: guard(run), prepared, input };
  }
  function success(g: AttemptGuard): ModelResult {
    const text = stableSerialize(encodeRTWire(fixture.proposal));
    return {
      schemaVersion: 'model-result/0.1',
      runId: g.runId,
      attemptId: g.attemptId,
      observation: {
        kind: 'COMPLETE',
        publicText: text,
        refusal: null,
        responseId: 'offline-response',
        requestId: 'offline-request',
        modelId: profile.modelId,
        httpStatus: 200,
        usage: { inputTokens: 100, outputTokens: 200, totalTokens: 300 },
        reason: null,
      },
      draft: {
        schemaVersion: 'raw-model-draft/0.1',
        text,
        validation: 'VALID',
        proposal: fixture.proposal,
      },
      outcome: 'SUCCEEDED',
    };
  }
  async function counters(id: string): Promise<{
    calls_used: string;
    reserved_micros: string;
    spent_micros: string;
    blocked: boolean;
  }> {
    const rows: {
      calls_used: string;
      reserved_micros: string;
      spent_micros: string;
      blocked: boolean;
    }[] = await source.query(
      'SELECT calls_used,reserved_micros,spent_micros,blocked FROM research_ai.execution_authorizations WHERE authorization_id=$1',
      [id],
    );
    return rows[0];
  }
  it('validates the maximum authorization, expiry and immutable idempotency before admitting calls', async () => {
    const auth = authorization();
    await executions.authorize(auth);
    await executions.authorize(auth);
    await expect(
      executions.authorize({ ...auth, maxCalls: 4 }),
    ).rejects.toMatchObject({ code: 'IDEMPOTENCY_CONFLICT' });
    for (const invalid of [
      { budgetMicros: 5000001 },
      { maxCalls: 0 },
      { expiresAt: new Date(Date.now() - 1000).toISOString() },
    ]) {
      await expect(
        executions.authorize(authorization(invalid)),
      ).rejects.toMatchObject({ code: 'INVALID_INPUT' });
    }
    await expect(
      source.undoLastMigration({ transaction: 'all' }),
    ).rejects.toThrow('RESEARCH_EXECUTION_ROLLBACK_REQUIRES_EMPTY_EVIDENCE');
  });
  it.each([
    { maxCalls: 1, budgetMicros: 1000000 },
    { maxCalls: 5, budgetMicros: 102000 },
  ])(
    'serializes concurrent authorization admission with %j',
    async (limits) => {
      const auth = authorization(limits);
      const requests = await Promise.all(
        Array.from({ length: 4 }, () => setup(auth)),
      );
      const results = await Promise.allSettled(
        requests.map((r) => executions.reserveInvocation(r.guard, r.prepared)),
      );
      expect(results.filter((r) => r.status === 'fulfilled')).toHaveLength(1);
      expect(await counters(auth.id)).toEqual({
        calls_used: '1',
        reserved_micros: '102000',
        spent_micros: '0',
        blocked: false,
      });
    },
  );
  it('grants exactly one durable dispatch for a claim and rejects stale revision or attempt', async () => {
    const r = await setup();
    for (const badGuard of [
      { ...r.guard, revision: r.guard.revision + 1 },
      { ...r.guard, attemptId: randomUUID() },
    ]) {
      await expect(
        executions.reserveInvocation(badGuard, r.prepared),
      ).rejects.toMatchObject({ code: 'STALE_EXECUTION' });
    }
    const results = await Promise.allSettled(
      Array.from({ length: 4 }, () =>
        executions.reserveInvocation(r.guard, r.prepared),
      ),
    );
    expect(results.filter((x) => x.status === 'fulfilled')).toHaveLength(1);
    expect((await counters(r.auth.id)).calls_used).toBe('1');
  });
  it('rejects altered metadata, body instructions, model, output limit, schema, temperature and extra secret fields', async () => {
    const r = await setup();
    const changedBodies = [
      { model: 'other-model' },
      { max_output_tokens: 1 },
      { temperature: 1 },
      { instructions: 'forged' },
      { text: {} },
      { apiKey: 'must-not-persist' },
    ];
    const variants: PreparedModelRequest[] = [
      { ...r.prepared, envelopeHash: '0'.repeat(64) },
      { ...r.prepared, profileHash: '0'.repeat(64) },
      { ...r.prepared, maxInputTokens: 1 },
      { ...r.prepared, timeoutMs: 999 },
      { ...r.prepared, modelId: 'other' },
      { ...r.prepared, apiKey: 'must-not-persist' } as PreparedModelRequest,
      ...changedBodies.map((changes) => {
        const body = {
          ...(JSON.parse(r.prepared.bodyCanonical) as Record<string, unknown>),
          ...changes,
        };
        return {
          ...r.prepared,
          bodyCanonical: stableSerialize(body),
          requestHash: contentHash(body),
        };
      }),
    ];
    for (const value of variants)
      await expect(
        executions.reserveInvocation(r.guard, value),
      ).rejects.toMatchObject({ code: 'INVALID_INPUT' });
    expect(
      await executions.getInvocation(r.run.runId, r.guard.attemptId),
    ).toBeNull();
    expect((await counters(r.auth.id)).calls_used).toBe('0');
  });
  it('checks expiry again at reservation and rejects requests beyond the attempt deadline', async () => {
    const r = await setup(
      authorization({ expiresAt: new Date(Date.now() + 1100).toISOString() }),
    );
    await source.query('SELECT pg_sleep(1.2)');
    await expect(
      executions.reserveInvocation(r.guard, r.prepared),
    ).rejects.toMatchObject({ code: 'INVALID_INPUT' });
    const short = await setup(authorization(), 1);
    await expect(
      executions.reserveInvocation(short.guard, short.prepared),
    ).rejects.toMatchObject({ code: 'INVALID_INPUT' });
  });
  it('preserves legacy fail/retry before intent but prohibits legacy failure after intent', async () => {
    const r = await setup();
    const failed = await runs.failRun(r.guard, {
      code: 'LOCAL_PREPARATION_FAILED',
      phase: 'BEFORE_PROVIDER',
      retryable: true,
    });
    const retry = await runs.retryFailedRun(failed.runId, failed.revision);
    const claimed = await runs.claimRun(retry.runId, retry.revision, 30);
    await expect(
      executions.reserveInvocation(r.guard, r.prepared),
    ).rejects.toMatchObject({ code: 'STALE_EXECUTION' });
    await executions.reserveInvocation(guard(claimed), r.prepared);
    await expect(
      runs.failRun(guard(claimed), {
        code: 'PROVIDER_REJECTED',
        phase: 'PROVIDER',
        retryable: true,
      }),
    ).rejects.toBeDefined();
    await expect(
      runs.failRun(guard(claimed), {
        code: 'PROVIDER_REJECTED',
        phase: 'PROVIDER',
        retryable: false,
      }),
    ).rejects.toBeDefined();
    expect((await runs.getRun(claimed.runId)).run.status).toBe('RUNNING');
  });
  it('requires complete valid persisted evidence before success and enforces result foreign keys', async () => {
    const r = await setup();
    await expect(
      source.query(
        "UPDATE research_ai.generation_runs SET status='SUCCEEDED',revision=revision+1 WHERE run_id=$1",
        [r.run.runId],
      ),
    ).rejects.toMatchObject({ driverError: { code: '23514' } });
    const result = success(r.guard);
    await expect(
      source.query(
        'INSERT INTO research_ai.model_results(run_id,attempt_id,canonical,hash) VALUES($1,$2,$3,$4)',
        [
          r.run.runId,
          r.guard.attemptId,
          stableSerialize(result),
          contentHash(result),
        ],
      ),
    ).rejects.toMatchObject({ driverError: { code: '23503' } });
    await executions.reserveInvocation(r.guard, r.prepared);
    const unrelated = await setup();
    await expect(
      executions.finalizeInvocation(unrelated.guard, {
        ...result,
        runId: unrelated.run.runId,
        attemptId: unrelated.guard.attemptId,
      }),
    ).rejects.toMatchObject({ code: 'STALE_EXECUTION' });
    await expect(
      executions.finalizeInvocation(r.guard, {
        ...result,
        observation: { ...result.observation, modelId: 'unrelated-model' },
      }),
    ).rejects.toMatchObject({ code: 'INVALID_INPUT' });
    await expect(
      executions.finalizeInvocation(
        { ...r.guard, revision: r.guard.revision + 1 },
        result,
      ),
    ).rejects.toMatchObject({ code: 'STALE_EXECUTION' });
    await expect(
      executions.finalizeInvocation(r.guard, {
        ...result,
        observation: { ...result.observation, kind: 'INCOMPLETE' },
      }),
    ).rejects.toMatchObject({ code: 'INVALID_INPUT' });
    await expect(
      executions.finalizeInvocation(r.guard, { ...result, draft: null }),
    ).rejects.toMatchObject({ code: 'INVALID_INPUT' });
    const forged = {
      ...result,
      observation: { ...result.observation, publicText: '{}' },
      draft: { ...result.draft!, text: '{}' },
    };
    await expect(
      executions.finalizeInvocation(r.guard, forged),
    ).rejects.toMatchObject({ code: 'INVALID_INPUT' });
    expect(
      await executions.getResult(r.run.runId, r.guard.attemptId),
    ).toBeNull();
  });
  it('finalizes success, budget and terminal event atomically, replays identically and rejects conflicting evidence', async () => {
    const r = await setup();
    await executions.reserveInvocation(r.guard, r.prepared);
    const result = success(r.guard);
    const final = await executions.finalizeInvocation(r.guard, result);
    expect(final.status).toBe('SUCCEEDED');
    expect(await executions.finalizeInvocation(r.guard, result)).toEqual(final);
    expect(await executions.getResult(r.run.runId, r.guard.attemptId)).toEqual(
      result,
    );
    expect((await runs.getRun(r.run.runId)).events.map((x) => x.kind)).toEqual([
      'REGISTERED',
      'CLAIMED',
      'SUCCEEDED',
    ]);
    expect(await counters(r.auth.id)).toEqual({
      calls_used: '1',
      reserved_micros: '0',
      spent_micros: '300',
      blocked: false,
    });
    await expect(
      executions.finalizeInvocation(r.guard, {
        ...result,
        observation: { ...result.observation, requestId: 'other' },
      }),
    ).rejects.toMatchObject({ code: 'IDEMPOTENCY_CONFLICT' });
  });
  it('rolls back result, final run event and budget together if terminal event persistence fails', async () => {
    const r = await setup();
    await executions.reserveInvocation(r.guard, r.prepared);
    await source.query(`CREATE FUNCTION research_ai.test_abort_execution_event() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN IF NEW.kind='SUCCEEDED' THEN RAISE EXCEPTION 'injected'; END IF; RETURN NEW; END $$;
      CREATE TRIGGER test_abort_execution_event BEFORE INSERT ON research_ai.run_events FOR EACH ROW EXECUTE FUNCTION research_ai.test_abort_execution_event()`);
    try {
      await expect(
        executions.finalizeInvocation(r.guard, success(r.guard)),
      ).rejects.toMatchObject({ code: 'STORAGE_FAILURE' });
    } finally {
      await source.query(
        'DROP TRIGGER test_abort_execution_event ON research_ai.run_events; DROP FUNCTION research_ai.test_abort_execution_event()',
      );
    }
    expect(
      await executions.getResult(r.run.runId, r.guard.attemptId),
    ).toBeNull();
    expect((await runs.getRun(r.run.runId)).run).toEqual(r.run);
    expect(await counters(r.auth.id)).toEqual({
      calls_used: '1',
      reserved_micros: '102000',
      spent_micros: '0',
      blocked: false,
    });
    expect(
      (await executions.finalizeInvocation(r.guard, success(r.guard))).status,
    ).toBe('SUCCEEDED');
  });
  it.each(['UNCERTAIN', 'MISSING_USAGE', 'OVER_RESERVATION'] as const)(
    'retains conservative reservation and blocks new calls for %s',
    async (mode) => {
      const r = await setup();
      await executions.reserveInvocation(r.guard, r.prepared);
      const result = success(r.guard);
      const changed: ModelResult =
        mode === 'UNCERTAIN'
          ? {
              ...result,
              outcome: 'INTERRUPTED',
              draft: null,
              observation: {
                ...result.observation,
                kind: 'UNCERTAIN',
                publicText: null,
                reason: 'TIMEOUT',
              },
            }
          : {
              ...result,
              observation: {
                ...result.observation,
                usage:
                  mode === 'MISSING_USAGE'
                    ? null
                    : {
                        inputTokens: 102000,
                        outputTokens: 1,
                        totalTokens: 102001,
                      },
              },
            };
      const final = await executions.finalizeInvocation(r.guard, changed);
      expect(final.status).toBe(
        mode === 'UNCERTAIN' ? 'INTERRUPTED' : 'SUCCEEDED',
      );
      expect(await counters(r.auth.id)).toEqual({
        calls_used: '1',
        reserved_micros: '102000',
        spent_micros: '0',
        blocked: true,
      });
      const next = await setup(r.auth);
      await expect(
        executions.reserveInvocation(next.guard, next.prepared),
      ).rejects.toMatchObject({ code: 'INVALID_INPUT' });
    },
  );
  it('persists known pre-dispatch failure without inventing usage or releasing the call slot', async () => {
    const r = await setup();
    await executions.reserveInvocation(r.guard, r.prepared);
    const base = success(r.guard);
    const result: ModelResult = {
      ...base,
      outcome: 'FAILED',
      draft: null,
      observation: {
        ...base.observation,
        kind: 'NOT_SENT',
        publicText: null,
        refusal: null,
        responseId: null,
        requestId: null,
        modelId: null,
        httpStatus: null,
        usage: null,
        reason: 'DISABLED',
      },
    };
    expect((await executions.finalizeInvocation(r.guard, result)).status).toBe(
      'FAILED',
    );
    expect(await executions.getResult(r.run.runId, r.guard.attemptId)).toEqual(
      result,
    );
    expect(await counters(r.auth.id)).toEqual({
      calls_used: '1',
      reserved_micros: '0',
      spent_micros: '0',
      blocked: false,
    });
  });
  it('preserves blank public output as failed evidence and retains unknown consumption', async () => {
    const r = await setup();
    await executions.reserveInvocation(r.guard, r.prepared);
    const base = success(r.guard);
    const result: ModelResult = {
      ...base,
      outcome: 'FAILED',
      draft: null,
      observation: {
        ...base.observation,
        kind: 'INVALID_RESPONSE',
        publicText: '',
        usage: null,
        reason: 'MALFORMED_RESPONSE',
      },
    };
    expect((await executions.finalizeInvocation(r.guard, result)).status).toBe(
      'FAILED',
    );
    expect(await executions.getResult(r.run.runId, r.guard.attemptId)).toEqual(
      result,
    );
    expect(await counters(r.auth.id)).toEqual({
      calls_used: '1',
      reserved_micros: '102000',
      spent_micros: '0',
      blocked: true,
    });
  });
  it('rejects contradictory non-dispatch evidence and unsuccessful HTTP statuses on complete output', async () => {
    const r = await setup();
    await executions.reserveInvocation(r.guard, r.prepared);
    const base = success(r.guard);
    const notSent: ModelResult = {
      ...base,
      outcome: 'FAILED',
      draft: null,
      observation: {
        kind: 'NOT_SENT',
        publicText: null,
        refusal: null,
        responseId: null,
        requestId: null,
        modelId: null,
        httpStatus: null,
        usage: null,
        reason: 'DISABLED',
      },
    };
    const observations = [
      ...[
        { publicText: '' },
        { refusal: 'refused' },
        { responseId: 'response' },
        { requestId: 'request' },
        { modelId: profile.modelId },
        { httpStatus: 200 },
        { usage: base.observation.usage },
        { reason: 'TIMEOUT' as const },
        { reason: null },
      ].map((change) => ({ ...notSent.observation, ...change })),
    ];
    for (const observation of observations)
      await expect(
        executions.finalizeInvocation(r.guard, { ...notSent, observation }),
      ).rejects.toMatchObject({ code: 'INVALID_INPUT' });
    for (const httpStatus of [null, 199, 300, 401, 500])
      await expect(
        executions.finalizeInvocation(r.guard, {
          ...base,
          observation: { ...base.observation, httpStatus },
        }),
      ).rejects.toMatchObject({ code: 'INVALID_INPUT' });
    expect(
      await executions.getResult(r.run.runId, r.guard.attemptId),
    ).toBeNull();
    expect((await counters(r.auth.id)).reserved_micros).toBe('102000');
  });
  it('recovers after connection restart, retains intent and stores late evidence without promoting interrupted runs', async () => {
    const r = await setup(authorization(), 2);
    await executions.reserveInvocation(r.guard, r.prepared);
    await source.query('SELECT pg_sleep(2.1)');
    await source.destroy();
    await source.initialize();
    runs = new PostgresRunStore(source);
    executions = new PostgresGenerationExecutionStore(source);
    expect(await runs.recoverExpired(100)).toContain(r.run.runId);
    expect((await counters(r.auth.id)).blocked).toBe(true);
    const blocked = await setup(r.auth);
    await expect(
      executions.reserveInvocation(blocked.guard, blocked.prepared),
    ).rejects.toMatchObject({ code: 'INVALID_INPUT' });
    expect(
      (await executions.getInvocation(r.run.runId, r.guard.attemptId))
        ?.prepared,
    ).toEqual(r.prepared);
    expect(
      (await executions.finalizeInvocation(r.guard, success(r.guard))).status,
    ).toBe('INTERRUPTED');
    expect(
      (await executions.getResult(r.run.runId, r.guard.attemptId))?.outcome,
    ).toBe('SUCCEEDED');
    expect((await counters(r.auth.id)).blocked).toBe(true);
    expect((await counters(r.auth.id)).reserved_micros).toBe('102000');
    await expect(
      executions.reserveInvocation(r.guard, r.prepared),
    ).rejects.toMatchObject({ code: 'STALE_EXECUTION' });
  });
  it('reconstructs committed invocation/result/run in a separate process without shared application memory', async () => {
    const r = await setup();
    await executions.reserveInvocation(r.guard, r.prepared);
    await executions.finalizeInvocation(r.guard, success(r.guard));
    const code = `const {DataSource}=require('typeorm'); const fs=require('node:fs');
      const {RESEARCH_ENTITIES}=require('./src/modules/research-ai/infrastructure/persistence/research-records');
      const {PostgresRunStore}=require('./src/modules/research-ai/infrastructure/persistence/postgres-run-store');
      const {PostgresGenerationExecutionStore}=require('./src/modules/research-ai/infrastructure/persistence/postgres-generation-execution-store');
      (async()=>{const config=JSON.parse(fs.readFileSync(process.env.RESEARCH_AI_S1C_TEST_DB_CONFIG,'utf8'));
      if(config.host!=='127.0.0.1'||config.database!=='rg_das_s1c_test')throw Error('ISOLATED_ONLY');
      const db=await new DataSource({type:'postgres',...config,entities:RESEARCH_ENTITIES,synchronize:false}).initialize();
      try {const executions=new PostgresGenerationExecutionStore(db);const runs=new PostgresRunStore(db);
      process.stdout.write(JSON.stringify({invocation:await executions.getInvocation(process.argv[1],process.argv[2]),result:await executions.getResult(process.argv[1],process.argv[2]),run:await runs.getRun(process.argv[1])}));}finally{await db.destroy();}})().catch(()=>{process.exitCode=1});`;
    const child = await promisify(execFile)(
      process.execPath,
      [
        '-r',
        'ts-node/register/transpile-only',
        '-e',
        code,
        r.run.runId,
        r.guard.attemptId,
      ],
      { timeout: 15000, maxBuffer: 2000000 },
    );
    expect(JSON.parse(child.stdout) as unknown).toEqual({
      invocation: await executions.getInvocation(
        r.run.runId,
        r.guard.attemptId,
      ),
      result: await executions.getResult(r.run.runId, r.guard.attemptId),
      run: await runs.getRun(r.run.runId),
    });
  }, 20000);
  it('rejects updates, deletion, truncate, authorization reset and downgrade that would destroy durable evidence', async () => {
    const r = await setup();
    await executions.reserveInvocation(r.guard, r.prepared);
    await executions.finalizeInvocation(r.guard, success(r.guard));
    for (const table of ['model_invocations', 'model_results'])
      for (const sql of [
        `UPDATE research_ai.${table} SET canonical=canonical`,
        `DELETE FROM research_ai.${table}`,
        `TRUNCATE research_ai.${table} CASCADE`,
      ])
        await expect(source.query(sql)).rejects.toMatchObject({
          driverError: { code: '23514' },
        });
    await expect(
      source.query(
        'UPDATE research_ai.execution_authorizations SET calls_used=0 WHERE authorization_id=$1',
        [r.auth.id],
      ),
    ).rejects.toMatchObject({ driverError: { code: '23514' } });
    await expect(
      source.query(
        'DELETE FROM research_ai.execution_authorizations WHERE authorization_id=$1',
        [r.auth.id],
      ),
    ).rejects.toMatchObject({ driverError: { code: '23514' } });
    await expect(
      source.undoLastMigration({ transaction: 'all' }),
    ).rejects.toThrow('RESEARCH_EXECUTION_ROLLBACK_REQUIRES_EMPTY_EVIDENCE');
    expect((await runs.getRun(r.run.runId)).run.status).toBe('SUCCEEDED');
  });
});
