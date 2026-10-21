// Created by: Codex (AI-assisted), 2026-10-19
import { DataSource, EntityManager } from 'typeorm';
import {
  Contract,
  enumeration,
  freeze,
  invariant,
  numberContract,
  objectOf,
  oneOf,
  stableSerialize,
  textContract,
} from '../../domain/contract';
import { RunPersistenceError } from '../../domain/generation-run';
import type { GenerationRun } from '../../domain/generation-run';
import {
  createTrainingProgramProposal,
  trainingProgramContract,
} from '../../domain/training-program-proposal';
import { contentHash } from '../../application/context-intelligence';
import {
  executionAuthorizationContract,
  modelProfileHash,
  observedCostMicros,
  reserveCostMicros,
  validateExecutionAuthorization,
} from '../../application/execution-policy';
import type { ExecutionAuthorization } from '../../application/execution-policy';
import type {
  GenerationExecutionStore,
  ModelResult,
  StoredInvocation,
} from '../../application/generation-execution-store.port';
import type { PreparedModelRequest } from '../../application/model-gateway.port';
import type { AttemptGuard } from '../../application/run-persistence.port';
import {
  PostgresArtifactRepository,
  readDocument,
} from './postgres-artifact-repository';
import { GenerationRunRecord } from './research-records';
import type { RunRecord } from './research-records';
import { toRun } from './postgres-run-store';
import { storageBoundary } from './storage-errors';
import { OpenAIResponsesGateway } from '../openai/openai-responses-gateway';
import { decodeRTWire } from '../openai/openai-rt-wire';

const evidenceText: Contract<string> = {
  schema: { type: 'string' },
  parse(value) {
    invariant(typeof value === 'string', 'EXPECTED_TEXT');
    return value;
  },
};
const nullableText = oneOf(evidenceText, enumeration(null));
const positive = numberContract(1, true, Number.MAX_SAFE_INTEGER);
const hash = textContract('^[a-f0-9]{64}$');
const preparedContract = objectOf({
  schemaVersion: enumeration('prepared-model-request/0.1'),
  gatewayVersion: textContract(),
  wireSchemaVersion: textContract(),
  bodyCanonical: textContract(),
  requestHash: hash,
  envelopeHash: hash,
  modelId: textContract(),
  maxOutputTokens: positive,
  maxInputTokens: positive,
  maxRequestBytes: positive,
  maxResponseBytes: positive,
  timeoutMs: positive,
  profileHash: hash,
  profileKind: enumeration('VERIFIED', 'SYNTHETIC_TEST'),
});
const usageNumber = numberContract(0, true, Number.MAX_SAFE_INTEGER);
const observationContract = objectOf({
  kind: enumeration(
    'COMPLETE',
    'REFUSAL',
    'INCOMPLETE',
    'PROVIDER_FAILED',
    'HTTP_REJECTED',
    'UNCERTAIN',
    'NOT_SENT',
    'INVALID_RESPONSE',
  ),
  publicText: nullableText,
  refusal: nullableText,
  responseId: nullableText,
  requestId: nullableText,
  modelId: nullableText,
  httpStatus: oneOf(numberContract(100, true, 599), enumeration(null)),
  usage: oneOf(
    objectOf({
      inputTokens: usageNumber,
      outputTokens: usageNumber,
      totalTokens: usageNumber,
    }),
    enumeration(null),
  ),
  reason: enumeration(
    null,
    'DISABLED',
    'MISSING_CREDENTIAL',
    'INVALID_PREPARED_REQUEST',
    'PROFILE_EXPIRED',
    'SYNTHETIC_PROFILE',
    'ALREADY_INVOKED',
    'CANCELLED',
    'TIMEOUT',
    'NETWORK_ERROR',
    'RESPONSE_TOO_LARGE',
    'AUTHENTICATION',
    'RATE_LIMIT',
    'HTTP_ERROR',
    'SERVER_ERROR',
    'MALFORMED_RESPONSE',
    'SECRET_ECHO',
    'MAX_OUTPUT_TOKENS',
    'CONTENT_FILTER',
    'PROVIDER_FAILURE',
  ),
});
const resultContract = objectOf({
  schemaVersion: enumeration('model-result/0.1'),
  runId: textContract(),
  attemptId: textContract(),
  observation: observationContract,
  draft: oneOf(
    objectOf({
      schemaVersion: enumeration('raw-model-draft/0.1'),
      text: evidenceText,
      validation: enumeration(
        'VALID',
        'INVALID_JSON',
        'INVALID_SCHEMA',
        'INVALID_DOMAIN',
      ),
      proposal: oneOf(trainingProgramContract, enumeration(null)),
    }),
    enumeration(null),
  ),
  outcome: enumeration('SUCCEEDED', 'FAILED', 'INTERRUPTED'),
});
interface AuthRow {
  canonical: string;
  hash: string;
  blocked: boolean;
  calls_used: string;
  reserved_micros: string;
  spent_micros: string;
}
interface InvocationRow {
  run_id: string;
  attempt_id: string;
  claim_revision: number;
  authorization_id: string;
  canonical: string;
  hash: string;
  reserved_micros: string;
  created_at: Date;
}
interface ResultRow {
  canonical: string;
  hash: string;
}
function requireCondition(
  condition: unknown,
  code:
    | 'INVALID_INPUT'
    | 'STALE_EXECUTION'
    | 'IDEMPOTENCY_CONFLICT'
    | 'INTEGRITY_VIOLATION' = 'INVALID_INPUT',
): asserts condition {
  if (!condition) throw new RunPersistenceError(code);
}
function parsed<T>(operation: () => T): T {
  try {
    return operation();
  } catch {
    throw new RunPersistenceError('INVALID_INPUT');
  }
}
function invocation(row: InvocationRow): StoredInvocation {
  const prepared = readDocument({
    hash: row.hash,
    canonical: row.canonical,
  }) as PreparedModelRequest;
  return freeze({
    runId: row.run_id,
    attemptId: row.attempt_id,
    claimRevision: row.claim_revision,
    authorizationId: row.authorization_id,
    prepared,
    reservedMicros: Number(row.reserved_micros),
    createdAt: row.created_at.toISOString(),
  });
}

/** Short database transactions only. No transport or credential is accessible here. */
export class PostgresGenerationExecutionStore implements GenerationExecutionStore {
  constructor(private readonly source: DataSource) {}
  private transaction<T>(
    operation: (manager: EntityManager) => Promise<T>,
  ): Promise<T> {
    return storageBoundary(() => this.source.transaction(operation));
  }
  async authorize(input: ExecutionAuthorization): Promise<void> {
    const policy = parsed(() => validateExecutionAuthorization(input));
    const canonical = stableSerialize(policy);
    await this.transaction(async (manager) => {
      await manager.query(
        'SELECT pg_advisory_xact_lock(hashtextextended($1,0))',
        [`execution-authorization:${policy.id}`],
      );
      const rows: AuthRow[] = await manager.query(
        'SELECT * FROM research_ai.execution_authorizations WHERE authorization_id=$1',
        [policy.id],
      );
      if (rows.length) {
        requireCondition(
          rows[0].canonical === canonical,
          'IDEMPOTENCY_CONFLICT',
        );
        return;
      }
      await manager.query(
        `INSERT INTO research_ai.execution_authorizations
        (authorization_id,canonical,hash,scope,profile_hash,expires_at,max_calls,budget_micros)
        VALUES($1,$2,$3,$4,$5,$6,$7,$8)`,
        [
          policy.id,
          canonical,
          contentHash(policy),
          policy.scope,
          modelProfileHash(policy.profile),
          policy.expiresAt,
          policy.maxCalls,
          policy.budgetMicros,
        ],
      );
    });
  }
  private async lockRun(
    manager: EntityManager,
    runId: string,
  ): Promise<RunRecord> {
    const row = await manager
      .getRepository(GenerationRunRecord)
      .findOne({ where: { runId }, lock: { mode: 'pessimistic_write' } });
    requireCondition(row, 'STALE_EXECUTION');
    return row;
  }
  private async lockAuthorization(
    manager: EntityManager,
    id: string,
  ): Promise<AuthRow> {
    const rows: AuthRow[] = await manager.query(
      'SELECT * FROM research_ai.execution_authorizations WHERE authorization_id=$1 FOR UPDATE',
      [id],
    );
    requireCondition(rows.length === 1);
    return rows[0];
  }
  async reserveInvocation(
    guard: AttemptGuard,
    preparedInput: PreparedModelRequest,
  ): Promise<StoredInvocation> {
    // Snapshot mutable caller objects before waiting for database locks.
    const prepared = parsed(() => preparedContract.parse(preparedInput));
    return this.transaction(async (manager) => {
      const row = await this.lockRun(manager, guard.runId);
      const [{ now }]: { now: Date }[] = await manager.query(
        'SELECT clock_timestamp() AS now',
      );
      requireCondition(
        row.status === 'RUNNING' &&
          row.revision === guard.revision &&
          row.attemptId === guard.attemptId &&
          row.leaseExpiresAt &&
          row.leaseExpiresAt > now,
        'STALE_EXECUTION',
      );
      const configuration = toRun(row).configuration;
      requireCondition(
        configuration.schemaVersion === 'generation-run-config/0.2',
      );
      const execution = configuration.execution;
      const authRow = await this.lockAuthorization(
        manager,
        execution.authorizationId,
      );
      const authorization = parsed(() =>
        validateExecutionAuthorization(readDocument(authRow), now),
      );
      const reserve = parsed(() =>
        reserveCostMicros(
          authorization.profile,
          prepared.maxInputTokens,
          prepared.maxOutputTokens,
        ),
      );
      requireCondition(
        !authRow.blocked &&
          authorization.scope === row.scope &&
          Number(authRow.calls_used) < authorization.maxCalls,
      );
      requireCondition(
        BigInt(authRow.reserved_micros) +
          BigInt(authRow.spent_micros) +
          BigInt(reserve) <=
          BigInt(authorization.budgetMicros),
      );
      requireCondition(
        prepared.schemaVersion === 'prepared-model-request/0.1' &&
          prepared.profileHash === execution.profileHash &&
          prepared.profileHash === modelProfileHash(authorization.profile) &&
          prepared.profileKind === authorization.profile.kind &&
          prepared.modelId === configuration.target.modelId &&
          prepared.modelId === authorization.profile.modelId &&
          configuration.target.providerId ===
            authorization.profile.providerId &&
          prepared.envelopeHash === row.envelopeHash &&
          prepared.maxOutputTokens === configuration.target.maxOutputTokens &&
          prepared.gatewayVersion === execution.gatewayVersion &&
          prepared.wireSchemaVersion === execution.wireSchemaVersion &&
          prepared.maxInputTokens === execution.maxInputTokens &&
          prepared.maxRequestBytes === execution.maxRequestBytes &&
          prepared.maxResponseBytes === execution.maxResponseBytes &&
          prepared.timeoutMs === execution.timeoutMs &&
          Buffer.byteLength(prepared.bodyCanonical, 'utf8') <=
            execution.maxRequestBytes &&
          row.leaseExpiresAt.getTime() >
            now.getTime() + prepared.timeoutMs + 1000,
      );
      const envelope = await new PostgresArtifactRepository(
        manager,
      ).getPromptEnvelope(row.envelopeHash);
      const expected = parsed(() =>
        new OpenAIResponsesGateway({ now: () => now }).prepare(
          envelope,
          configuration,
          authorization.profile,
        ),
      );
      requireCondition(stableSerialize(prepared) === stableSerialize(expected));
      const duplicates: InvocationRow[] = await manager.query(
        'SELECT * FROM research_ai.model_invocations WHERE run_id=$1 AND attempt_id=$2',
        [guard.runId, guard.attemptId],
      );
      requireCondition(duplicates.length === 0, 'STALE_EXECUTION');
      const rows: InvocationRow[] = await manager.query(
        `INSERT INTO research_ai.model_invocations
        (run_id,attempt_id,claim_revision,authorization_id,configuration_hash,envelope_hash,canonical,hash,request_hash,reserved_micros)
        VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
        [
          guard.runId,
          guard.attemptId,
          guard.revision,
          authorization.id,
          row.configurationHash,
          row.envelopeHash,
          stableSerialize(prepared),
          contentHash(prepared),
          prepared.requestHash,
          reserve,
        ],
      );
      await manager.query(
        'UPDATE research_ai.execution_authorizations SET calls_used=calls_used+1,reserved_micros=reserved_micros+$2 WHERE authorization_id=$1',
        [authorization.id, reserve],
      );
      return invocation(rows[0]);
    });
  }
  async finalizeInvocation(
    guard: AttemptGuard,
    input: ModelResult,
  ): Promise<GenerationRun> {
    const result: ModelResult = parsed(() => resultContract.parse(input));
    requireCondition(
      result.runId === guard.runId && result.attemptId === guard.attemptId,
    );
    requireCondition(
      (result.observation.kind === 'UNCERTAIN') ===
        (result.outcome === 'INTERRUPTED'),
    );
    requireCondition(
      (result.outcome === 'SUCCEEDED') ===
        (result.observation.kind === 'COMPLETE' &&
          result.draft?.validation === 'VALID' &&
          result.draft.proposal !== null),
    );
    requireCondition(
      result.draft === null ||
        (result.draft.text === result.observation.publicText &&
          (result.draft.validation === 'VALID') ===
            (result.draft.proposal !== null)),
    );
    if (result.observation.kind === 'NOT_SENT')
      requireCondition(
        result.draft === null &&
          result.observation.publicText === null &&
          result.observation.refusal === null &&
          result.observation.responseId === null &&
          result.observation.requestId === null &&
          result.observation.modelId === null &&
          result.observation.httpStatus === null &&
          result.observation.usage === null &&
          result.observation.reason !== null &&
          [
            'DISABLED',
            'MISSING_CREDENTIAL',
            'INVALID_PREPARED_REQUEST',
            'PROFILE_EXPIRED',
            'SYNTHETIC_PROFILE',
            'ALREADY_INVOKED',
            'CANCELLED',
          ].includes(result.observation.reason),
      );
    if (result.observation.kind === 'COMPLETE')
      requireCondition(
        result.observation.publicText !== null &&
          result.observation.responseId !== null &&
          result.observation.modelId !== null &&
          result.observation.httpStatus !== null &&
          result.observation.httpStatus >= 200 &&
          result.observation.httpStatus < 300 &&
          result.observation.refusal === null &&
          result.observation.reason === null,
      );
    const canonical = stableSerialize(result);
    // SQL evidence documents have a 1 MiB ceiling; never truncate or claim success on oversize evidence.
    requireCondition(Buffer.byteLength(canonical, 'utf8') <= 1_048_576);
    return this.transaction(async (manager) => {
      const row = await this.lockRun(manager, guard.runId);
      const rows: InvocationRow[] = await manager.query(
        'SELECT * FROM research_ai.model_invocations WHERE run_id=$1 AND attempt_id=$2',
        [guard.runId, guard.attemptId],
      );
      requireCondition(
        rows.length === 1 &&
          rows[0].claim_revision === guard.revision &&
          row.attemptId === guard.attemptId,
        'STALE_EXECUTION',
      );
      const stored = invocation(rows[0]);
      requireCondition(
        result.observation.publicText === null ||
          Buffer.byteLength(result.observation.publicText, 'utf8') <=
            stored.prepared.maxResponseBytes,
      );
      requireCondition(
        result.observation.refusal === null ||
          Buffer.byteLength(result.observation.refusal, 'utf8') <=
            stored.prepared.maxResponseBytes,
      );
      requireCondition(
        result.observation.modelId === null ||
          result.observation.modelId === stored.prepared.modelId,
      );
      const existing: ResultRow[] = await manager.query(
        'SELECT canonical,hash FROM research_ai.model_results WHERE run_id=$1 AND attempt_id=$2',
        [guard.runId, guard.attemptId],
      );
      if (existing.length) {
        requireCondition(
          existing[0].canonical === canonical,
          'IDEMPOTENCY_CONFLICT',
        );
        return toRun(row);
      }
      requireCondition(
        (row.status === 'RUNNING' && row.revision === guard.revision) ||
          row.status === 'INTERRUPTED',
        'STALE_EXECUTION',
      );
      if (result.draft?.proposal) {
        const artifacts = new PostgresArtifactRepository(manager);
        const snapshot = await artifacts.getCaseSnapshot(row.snapshotHash);
        const envelope = await artifacts.getPromptEnvelope(row.envelopeHash);
        const knowledge = await artifacts.getKnowledgeRelease(
          envelope.payload.trace.knowledgeReleaseHash,
        );
        const proposal = parsed(() =>
          createTrainingProgramProposal(
            result.draft!.proposal,
            knowledge,
            snapshot,
          ),
        );
        const decoded = parsed(() =>
          createTrainingProgramProposal(
            decodeRTWire(JSON.parse(result.draft!.text) as unknown),
            knowledge,
            snapshot,
          ),
        );
        requireCondition(
          stableSerialize(decoded) === stableSerialize(proposal),
        );
        requireCondition(
          proposal.horizon.weeks ===
            envelope.payload.instructions.task.horizonWeeks &&
            proposal.schedule.format ===
              envelope.payload.instructions.task.requestedRepresentation,
        );
      }
      const authRow = await this.lockAuthorization(
        manager,
        stored.authorizationId,
      );
      const authorization = executionAuthorizationContract.parse(
        readDocument(authRow),
      );
      const [{ now }]: { now: Date }[] = await manager.query(
        'SELECT clock_timestamp() AS now',
      );
      const late =
        row.status === 'INTERRUPTED' ||
        !row.leaseExpiresAt ||
        row.leaseExpiresAt <= now;
      const uncertain = result.outcome === 'INTERRUPTED' || late;
      const estimated =
        result.observation.kind === 'NOT_SENT'
          ? 0
          : result.observation.usage === null
            ? null
            : parsed(() =>
                observedCostMicros(
                  authorization.profile,
                  result.observation.usage!,
                ),
              );
      const retain =
        uncertain || estimated === null || estimated > stored.reservedMicros;
      await manager.query(
        `INSERT INTO research_ai.model_results(run_id,attempt_id,canonical,hash,estimated_cost_micros)
        VALUES($1,$2,$3,$4,$5)`,
        [
          guard.runId,
          guard.attemptId,
          canonical,
          contentHash(result),
          estimated,
        ],
      );
      if (retain) {
        await manager.query(
          'UPDATE research_ai.execution_authorizations SET blocked=true WHERE authorization_id=$1',
          [stored.authorizationId],
        );
      } else {
        await manager.query(
          'UPDATE research_ai.execution_authorizations SET reserved_micros=reserved_micros-$2,spent_micros=spent_micros+$3 WHERE authorization_id=$1',
          [stored.authorizationId, stored.reservedMicros, estimated],
        );
      }
      if (row.status === 'RUNNING') {
        const status = late ? 'INTERRUPTED' : result.outcome;
        const error =
          status === 'SUCCEEDED'
            ? null
            : status === 'INTERRUPTED'
              ? {
                  code: 'EXTERNAL_OUTCOME_UNCERTAIN',
                  phase: 'PROVIDER',
                  retryable: false,
                }
              : {
                  code:
                    result.observation.kind === 'NOT_SENT'
                      ? 'LOCAL_PREPARATION_FAILED'
                      : result.observation.kind === 'COMPLETE'
                        ? 'RESPONSE_INVALID'
                        : 'PROVIDER_REJECTED',
                  phase:
                    result.observation.kind === 'NOT_SENT'
                      ? 'BEFORE_PROVIDER'
                      : result.observation.kind === 'COMPLETE'
                        ? 'AFTER_PROVIDER'
                        : 'PROVIDER',
                  retryable: false,
                };
        await manager
          .createQueryBuilder()
          .update(GenerationRunRecord)
          .set({ status, error, revision: () => 'revision+1' })
          .where('run_id=:runId', { runId: guard.runId })
          .execute();
      }
      const final = await manager
        .getRepository(GenerationRunRecord)
        .findOneByOrFail({ runId: guard.runId });
      return toRun(final);
    });
  }
  getInvocation(
    runId: string,
    attemptId: string,
  ): Promise<StoredInvocation | null> {
    return storageBoundary(async () => {
      const rows: InvocationRow[] = await this.source.query(
        'SELECT * FROM research_ai.model_invocations WHERE run_id=$1 AND attempt_id=$2',
        [runId, attemptId],
      );
      return rows.length ? invocation(rows[0]) : null;
    });
  }
  getResult(runId: string, attemptId: string): Promise<ModelResult | null> {
    return storageBoundary(async () => {
      const rows: ResultRow[] = await this.source.query(
        'SELECT canonical,hash FROM research_ai.model_results WHERE run_id=$1 AND attempt_id=$2',
        [runId, attemptId],
      );
      return rows.length
        ? freeze(resultContract.parse(readDocument(rows[0])))
        : null;
    });
  }
}
