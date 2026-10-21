// Created by: Codex (AI-assisted), 2026-10-19
import { randomBytes, randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';
import https from 'node:https';
import { DataSource } from 'typeorm';
import { buildRtF04Example } from '../fixtures/rt-f04.fixture';
import { stableSerialize } from '../domain/contract';
import type { ExecutionRunConfiguration } from '../domain/generation-run';
import { PostgresRunStore } from '../infrastructure/persistence/postgres-run-store';
import { PostgresGenerationExecutionStore } from '../infrastructure/persistence/postgres-generation-execution-store';
import { RESEARCH_ENTITIES } from '../infrastructure/persistence/research-records';
import { ResearchRunPersistence1792368000000 } from '../infrastructure/persistence/migrations/1792368000000-ResearchRunPersistence';
import { ResearchModelExecution1792454400000 } from '../infrastructure/persistence/migrations/1792454400000-ResearchModelExecution';
import {
  OpenAIResponsesGateway,
  OPENAI_RESPONSES_GATEWAY_VERSION,
} from '../infrastructure/openai/openai-responses-gateway';
import {
  encodeRTWire,
  OPENAI_RT_WIRE_VERSION,
} from '../infrastructure/openai/openai-rt-wire';
import type {
  ResponsesTransportRequest,
  TransportResult,
} from '../infrastructure/openai/https-responses-transport';
import type { ModelProfile, ExecutionAuthorization } from './execution-policy';
import { modelProfileHash } from './execution-policy';
import { GenerationWorkflow } from './generation-workflow';
import type { RegisterRunInput } from './run-persistence.port';

const configPath = process.env.RESEARCH_AI_S1C_WORKFLOW_TEST_DB_CONFIG;
const postgres = configPath ? describe : describe.skip;
postgres(
  'S1C workflow with real PostgreSQL and offline Responses transport',
  () => {
    let source: DataSource;
    let runs: PostgresRunStore;
    let executions: PostgresGenerationExecutionStore;
    let profile: ModelProfile;
    let options: ConstructorParameters<typeof DataSource>[0];
    let networkGuard: jest.SpyInstance;
    const fixture = buildRtF04Example();
    beforeAll(async () => {
      networkGuard = jest.spyOn(https, 'request').mockImplementation(() => {
        throw new Error('REAL_HTTP_FORBIDDEN_IN_OFFLINE_SUITE');
      });
      const config = JSON.parse(readFileSync(configPath!, 'utf8')) as {
        host: string;
        database: string;
        port: number;
        username: string;
        password: string;
      };
      if (
        config.host !== '127.0.0.1' ||
        config.database !== 'rg_das_s1c_workflow_test'
      )
        throw new Error('DISPOSABLE_WORKFLOW_DATABASE_REQUIRED');
      options = {
        type: 'postgres',
        ...config,
        entities: RESEARCH_ENTITIES,
        migrations: [
          ResearchRunPersistence1792368000000,
          ResearchModelExecution1792454400000,
        ],
        migrationsTableName: 's1c_workflow_test_migrations',
        synchronize: false,
        logging: false,
      };
      source = await new DataSource(options).initialize();
      await source.runMigrations({ transaction: 'all' });
      runs = new PostgresRunStore(source);
      executions = new PostgresGenerationExecutionStore(source);
      profile = {
        schemaVersion: 'model-profile/0.1',
        kind: 'SYNTHETIC_TEST',
        providerId: 'openai',
        modelId: 'synthetic-offline-model',
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
    });
    afterAll(async () => {
      expect(networkGuard).not.toHaveBeenCalled();
      networkGuard?.mockRestore();
      if (source?.isInitialized) await source.destroy();
    });
    async function setup(maxCalls = 1, budgetMicros = 200000) {
      const auth: ExecutionAuthorization = {
        schemaVersion: 'execution-authorization/0.1',
        id: randomUUID(),
        scope: 'synthetic-workflow-tests',
        profile,
        maxCalls,
        budgetMicros,
        expiresAt: profile.expiresAt,
      };
      await executions.authorize(auth);
      const configuration: ExecutionRunConfiguration = {
        schemaVersion: 'generation-run-config/0.2',
        workflow: { id: 'rt-workflow', version: 's1c-offline' },
        target: {
          providerId: 'openai',
          modelId: profile.modelId,
          maxOutputTokens: 2000,
          temperature: null,
        },
        execution: {
          authorizationId: auth.id,
          profileHash: modelProfileHash(profile),
          gatewayVersion: OPENAI_RESPONSES_GATEWAY_VERSION,
          wireSchemaVersion: OPENAI_RT_WIRE_VERSION,
          maxInputTokens: 100000,
          maxRequestBytes: 1000000,
          maxResponseBytes: 1000000,
          timeoutMs: 1000,
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
      return { input, auth };
    }
    function response(
      text = stableSerialize(encodeRTWire(fixture.proposal)),
      status = 'completed',
    ): Promise<TransportResult> {
      return Promise.resolve({
        kind: 'RESPONSE',
        status: 200,
        requestId: 'offline-request',
        body: JSON.stringify({
          id: 'offline-response',
          model: profile.modelId,
          status,
          usage: { input_tokens: 1000, output_tokens: 500, total_tokens: 1500 },
          output: [
            {
              type: 'message',
              role: 'assistant',
              status: 'completed',
              content: [{ type: 'output_text', text }],
            },
          ],
          incomplete_details:
            status === 'incomplete' ? { reason: 'max_output_tokens' } : null,
        }),
      });
    }
    function gateway(
      send: (request: ResponsesTransportRequest) => Promise<TransportResult>,
      enabled = true,
    ) {
      const secret = randomBytes(32).toString('hex');
      return new OpenAIResponsesGateway({
        transport: { live: false, send },
        externalExecutionEnabled: () => enabled,
        credential: () => secret,
      });
    }
    it('persists a validated result atomically and reentry after reconnect never dispatches again', async () => {
      const { input } = await setup();
      const send = jest.fn(() => response());
      const workflow = new GenerationWorkflow(runs, executions, gateway(send));
      const result = await workflow.execute(input, profile);
      expect(result.status).toBe('SUCCEEDED');
      expect(result.schemaVersion).toBe('generation-run/0.2');
      const stored = await executions.getResult(
        result.runId,
        result.attemptId!,
      );
      expect(stored?.draft?.proposal).toEqual(fixture.proposal);
      expect((await runs.getRun(result.runId)).events.at(-1)?.kind).toBe(
        'SUCCEEDED',
      );
      await source.destroy();
      source = await new DataSource(options).initialize();
      runs = new PostgresRunStore(source);
      executions = new PostgresGenerationExecutionStore(source);
      const afterRestart = new GenerationWorkflow(
        runs,
        executions,
        gateway(send),
      );
      expect(await afterRestart.execute(input, profile)).toEqual(result);
      expect(send).toHaveBeenCalledTimes(1);
    });
    it.each([
      ['invalid JSON', '{', 'INVALID_JSON'],
      ['invalid schema', '{}', 'INVALID_SCHEMA'],
      [
        'invalid domain',
        stableSerialize({
          ...(encodeRTWire(fixture.proposal) as object),
          caseRef: {
            caseId: 'wrong-case',
            snapshotId: fixture.snapshot.snapshotId,
          },
        }),
        'INVALID_DOMAIN',
      ],
    ])(
      'stores %s without declaring success',
      async (_name, text, validation) => {
        const { input } = await setup();
        const send = jest.fn(() => response(text));
        const result = await new GenerationWorkflow(
          runs,
          executions,
          gateway(send),
        ).execute(input, profile);
        expect(result.status).toBe('FAILED');
        expect(
          (await executions.getResult(result.runId, result.attemptId!))?.draft
            ?.validation,
        ).toBe(validation);
        expect(send).toHaveBeenCalledTimes(1);
      },
    );
    it('rejects a valid-domain proposal that does not match the requested horizon', async () => {
      const { input } = await setup();
      const changed = {
        ...(encodeRTWire(fixture.proposal) as object),
        horizon: { weeks: 5 },
      };
      const result = await new GenerationWorkflow(
        runs,
        executions,
        gateway(() => response(stableSerialize(changed))),
      ).execute(input, profile);
      expect(result.status).toBe('FAILED');
      expect(
        (await executions.getResult(result.runId, result.attemptId!))?.draft
          ?.validation,
      ).toBe('INVALID_DOMAIN');
    });
    it('records incomplete output as failure with its observable text', async () => {
      const { input } = await setup();
      const result = await new GenerationWorkflow(
        runs,
        executions,
        gateway(() => response('{"partial":', 'incomplete')),
      ).execute(input, profile);
      expect(result.status).toBe('FAILED');
      expect(
        (await executions.getResult(result.runId, result.attemptId!))
          ?.observation,
      ).toMatchObject({ kind: 'INCOMPLETE', publicText: '{"partial":' });
    });
    it('retains uncertainty after timeout and does not resend on a repeated request', async () => {
      const { input } = await setup();
      const send = jest.fn(
        (): Promise<TransportResult> =>
          Promise.resolve({
            kind: 'UNCERTAIN',
            reason: 'TIMEOUT',
          }),
      );
      const workflow = new GenerationWorkflow(runs, executions, gateway(send));
      const result = await workflow.execute(input, profile);
      expect(result.status).toBe('INTERRUPTED');
      expect(
        (await executions.getResult(result.runId, result.attemptId!))
          ?.observation.reason,
      ).toBe('TIMEOUT');
      expect((await workflow.execute(input, profile)).status).toBe(
        'INTERRUPTED',
      );
      expect(send).toHaveBeenCalledTimes(1);
    });
    it('does not hold a PostgreSQL transaction open while transport is pending', async () => {
      const { input } = await setup();
      const inspect = new DataSource(options);
      await inspect.initialize();
      try {
        const send = async (): Promise<TransportResult> => {
          const rows: { count: string }[] = await inspect.query(
            'SELECT count(*) FROM pg_stat_activity WHERE datname = current_database() AND pid <> pg_backend_pid() AND xact_start IS NOT NULL',
          );
          expect(Number(rows[0].count)).toBe(0);
          return response();
        };
        expect(
          (
            await new GenerationWorkflow(
              runs,
              executions,
              gateway(send),
            ).execute(input, profile)
          ).status,
        ).toBe('SUCCEEDED');
      } finally {
        await inspect.destroy();
      }
    });
    it('does not resend after result persistence fails and the caller repeats execution', async () => {
      const { input } = await setup();
      const send = jest.fn(() => response());
      const workflow = new GenerationWorkflow(runs, executions, gateway(send));
      await source.query(`CREATE FUNCTION research_ai.workflow_abort_success() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN IF NEW.kind='SUCCEEDED' THEN RAISE EXCEPTION 'synthetic failure'; END IF; RETURN NEW; END $$;
        CREATE TRIGGER workflow_abort_success BEFORE INSERT ON research_ai.run_events FOR EACH ROW EXECUTE FUNCTION research_ai.workflow_abort_success()`);
      try {
        await expect(workflow.execute(input, profile)).rejects.toMatchObject({
          code: 'STORAGE_FAILURE',
        });
      } finally {
        await source.query(
          'DROP TRIGGER workflow_abort_success ON research_ai.run_events; DROP FUNCTION research_ai.workflow_abort_success()',
        );
      }
      const replay = await workflow.execute(input, profile);
      expect(replay.status).toBe('RUNNING');
      expect(
        await executions.getInvocation(replay.runId, replay.attemptId!),
      ).not.toBeNull();
      expect(
        await executions.getResult(replay.runId, replay.attemptId!),
      ).toBeNull();
      expect(send).toHaveBeenCalledTimes(1);
    });
    it('rejects a legacy execution configuration before registering a new run', async () => {
      const { input } = await setup();
      const legacy: RegisterRunInput = {
        ...input,
        configuration: {
          schemaVersion: 'generation-run-config/0.1',
          workflow: input.configuration.workflow,
          target: { ...input.configuration.target, temperature: 0 },
        },
      };
      const send = jest.fn(() => response());
      await expect(
        new GenerationWorkflow(runs, executions, gateway(send)).execute(
          legacy,
          profile,
        ),
      ).rejects.toMatchObject({ code: 'INVALID_INPUT' });
      const rows: { count: string }[] = await source.query(
        'SELECT count(*) FROM research_ai.generation_runs WHERE scope=$1 AND idempotency_key=$2',
        [legacy.idempotency.scope, legacy.idempotency.key],
      );
      expect(rows[0].count).toBe('0');
      expect(send).not.toHaveBeenCalled();
    });
    it.each(['disabled', 'cancelled', 'budget', 'tokens'])(
      'blocks %s before any transport call',
      async (reason) => {
        const { input } = await setup(1, reason === 'budget' ? 1 : 200000);
        const send = jest.fn(() => response());
        const controller = new AbortController();
        if (reason === 'cancelled') controller.abort();
        const request =
          reason === 'tokens'
            ? {
                ...input,
                configuration: {
                  ...input.configuration,
                  execution: {
                    ...(input.configuration as ExecutionRunConfiguration)
                      .execution,
                    maxInputTokens: 1,
                  },
                },
              }
            : input;
        const result = await new GenerationWorkflow(
          runs,
          executions,
          gateway(send, reason !== 'disabled'),
        ).execute(request, profile, controller.signal);
        expect(result.status).toBe('FAILED');
        expect(send).not.toHaveBeenCalled();
      },
    );
  },
);
