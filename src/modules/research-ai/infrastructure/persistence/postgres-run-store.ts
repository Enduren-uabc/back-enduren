// Created by: Codex (AI-assisted), 2026-10-18
import { randomUUID } from 'node:crypto';
import { DataSource, EntityManager } from 'typeorm';
import { freeze, stableSerialize } from '../../domain/contract';
import {
  opaqueKey,
  runConfigurationContract,
  runFailureContract,
  RunPersistenceError,
} from '../../domain/generation-run';
import type {
  GenerationRun,
  RunEvent,
  RunFailure,
} from '../../domain/generation-run';
import type {
  AttemptGuard,
  RegisterRunInput,
  ResearchRunStore,
  StoredRun,
} from '../../application/run-persistence.port';
import { prepareRegistration } from '../../application/persisted-artifacts';
import {
  PostgresArtifactRepository,
  readDocument,
} from './postgres-artifact-repository';
import { GenerationRunRecord, RunEventRecord } from './research-records';
import type { RunRecord } from './research-records';
import { storageBoundary } from './storage-errors';

export function toRun(row: RunRecord): GenerationRun {
  const configuration = runConfigurationContract.parse(
    readDocument({
      hash: row.configurationHash,
      canonical: row.configurationCanonical,
    }),
  );
  return freeze({
    schemaVersion:
      configuration.schemaVersion === 'generation-run-config/0.2'
        ? ('generation-run/0.2' as const)
        : ('generation-run/0.1' as const),
    runId: row.runId,
    idempotency: { scope: row.scope, key: row.idempotencyKey },
    requestHash: row.requestHash,
    snapshotHash: row.snapshotHash,
    contextHash: row.contextHash,
    envelopeHash: row.envelopeHash,
    configuration,
    status: row.status,
    revision: row.revision,
    attemptNumber: row.attemptNumber,
    attemptId: row.attemptId,
    providerInvocationRef: row.providerInvocationRef,
    leaseExpiresAt: row.leaseExpiresAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    startedAt: row.startedAt?.toISOString() ?? null,
    finishedAt: row.finishedAt?.toISOString() ?? null,
    error: row.error,
  });
}

function checkLimit(limit: number, maximum: number): void {
  if (!Number.isSafeInteger(limit) || limit < 1 || limit > maximum) {
    throw new RunPersistenceError('INVALID_INPUT');
  }
}

export class PostgresRunStore implements ResearchRunStore {
  constructor(private readonly source: DataSource) {}

  private transaction<T>(
    operation: (manager: EntityManager) => Promise<T>,
    isolation: 'READ COMMITTED' | 'REPEATABLE READ' = 'READ COMMITTED',
  ): Promise<T> {
    return storageBoundary(() => this.source.transaction(isolation, operation));
  }

  private async readRow(
    manager: EntityManager,
    runId: string,
  ): Promise<RunRecord> {
    const row = await manager
      .getRepository(GenerationRunRecord)
      .findOneBy({ runId });
    if (!row) throw new RunPersistenceError('NOT_FOUND');
    return row;
  }

  async registerRun(input: RegisterRunInput): Promise<GenerationRun> {
    const prepared = prepareRegistration(input);
    return this.transaction(async (manager) => {
      // Serializes retries of one logical request. Hash collisions only cause extra waiting.
      await manager.query(
        'SELECT pg_advisory_xact_lock(hashtextextended($1, 0))',
        [stableSerialize([prepared.scope, prepared.key])],
      );
      const repository = manager.getRepository(GenerationRunRecord);
      // A claim can race an idempotent retry; keep state and events coherent while replaying.
      const existing = await repository.findOne({
        where: { scope: prepared.scope, idempotencyKey: prepared.key },
        lock: { mode: 'pessimistic_read' },
      });
      if (existing) {
        if (existing.requestHash !== prepared.requestHash)
          throw new RunPersistenceError('IDEMPOTENCY_CONFLICT');
        await this.loadRun(manager, existing.runId);
        return toRun(existing);
      }
      await new PostgresArtifactRepository(manager).saveBundle(prepared);
      const runId = randomUUID();
      await repository.insert({
        runId,
        scope: prepared.scope,
        idempotencyKey: prepared.key,
        requestHash: prepared.requestHash,
        snapshotHash: prepared.hashes.snapshotHash,
        contextHash: prepared.hashes.contextHash,
        envelopeHash: prepared.hashes.envelopeHash,
        configurationCanonical: stableSerialize(prepared.configuration),
        configurationHash: prepared.configurationHash,
        status: 'PENDING',
        revision: 0,
        attemptNumber: 0,
        attemptId: null,
        providerInvocationRef: null,
        leaseExpiresAt: null,
        startedAt: null,
        finishedAt: null,
        error: null,
      });
      return toRun(await this.readRow(manager, runId));
    });
  }

  private async loadRun(
    manager: EntityManager,
    runId: string,
  ): Promise<StoredRun> {
    const row = await this.readRow(manager, runId);
    const reader = new PostgresArtifactRepository(manager);
    const envelope = await reader.getPromptEnvelope(row.envelopeHash);
    const context = await reader.getContextPacket(row.contextHash);
    const snapshot = await reader.getCaseSnapshot(row.snapshotHash);
    const knowledge = await reader.getKnowledgeRelease(
      context.content.knowledgeReleaseHash,
    );
    const run = toRun(row);
    const prepared = prepareRegistration({
      snapshot,
      knowledge,
      context,
      envelope,
      configuration: run.configuration,
      idempotency: run.idempotency,
    });
    if (prepared.requestHash !== run.requestHash)
      throw new RunPersistenceError('INTEGRITY_VIOLATION');
    const eventRows = await manager
      .getRepository(RunEventRecord)
      .find({ where: { runId }, order: { revision: 'ASC' } });
    const events: RunEvent[] = eventRows.map((event) => ({
      ...event,
      occurredAt: event.occurredAt.toISOString(),
    }));
    if (
      events.length !== run.revision + 1 ||
      events.some((event, index) => event.revision !== index) ||
      events.at(-1)?.toStatus !== run.status
    )
      throw new RunPersistenceError('INTEGRITY_VIOLATION');
    return Object.freeze({
      run,
      snapshot,
      knowledge,
      context,
      envelope,
      events: freeze(events),
    });
  }

  getRun(runId: string): Promise<StoredRun> {
    // State and events must be observed at one database snapshot during concurrent transitions.
    return this.transaction(
      (manager) => this.loadRun(manager, runId),
      'REPEATABLE READ',
    );
  }
  getCaseSnapshot(hash: string) {
    return storageBoundary(() =>
      new PostgresArtifactRepository(this.source.manager).getCaseSnapshot(hash),
    );
  }
  getKnowledgeRelease(hash: string) {
    return storageBoundary(() =>
      new PostgresArtifactRepository(this.source.manager).getKnowledgeRelease(
        hash,
      ),
    );
  }
  getContextPacket(hash: string) {
    return storageBoundary(() =>
      new PostgresArtifactRepository(this.source.manager).getContextPacket(
        hash,
      ),
    );
  }
  getPromptEnvelope(hash: string) {
    return storageBoundary(() =>
      new PostgresArtifactRepository(this.source.manager).getPromptEnvelope(
        hash,
      ),
    );
  }

  async listPending(limit: number): Promise<readonly string[]> {
    checkLimit(limit, 100);
    const rows = await storageBoundary(() =>
      this.source.getRepository(GenerationRunRecord).find({
        select: { runId: true },
        where: { status: 'PENDING' },
        order: { createdAt: 'ASC', runId: 'ASC' },
        take: limit,
      }),
    );
    return rows.map((row) => row.runId);
  }

  async claimRun(
    runId: string,
    revision: number,
    leaseSeconds: number,
  ): Promise<GenerationRun> {
    checkLimit(leaseSeconds, 3600);
    return this.transaction(async (manager) => {
      const result = await manager
        .createQueryBuilder()
        .update(GenerationRunRecord)
        .set({
          status: 'RUNNING',
          revision: () => 'revision + 1',
          attemptNumber: () => 'attempt_number + 1',
          attemptId: randomUUID(),
          leaseExpiresAt: () =>
            "clock_timestamp() + (:leaseSeconds * interval '1 second')",
        })
        .where(
          'run_id = :runId AND revision = :revision AND status = :status',
          { runId, revision, status: 'PENDING', leaseSeconds },
        )
        .execute();
      if (result.affected !== 1)
        throw new RunPersistenceError('STALE_EXECUTION');
      return toRun(await this.readRow(manager, runId));
    });
  }

  private async updateAttempt(
    guard: AttemptGuard,
    values: Partial<
      Pick<RunRecord, 'status' | 'error' | 'providerInvocationRef'>
    >,
  ): Promise<GenerationRun> {
    return this.transaction(async (manager) => {
      const result = await manager
        .createQueryBuilder()
        .update(GenerationRunRecord)
        .set({ ...values, revision: () => 'revision + 1' })
        .where(
          'run_id = :runId AND revision = :revision AND attempt_id = :attemptId AND status = :status AND lease_expires_at > clock_timestamp()',
          { ...guard, status: 'RUNNING' },
        )
        .execute();
      if (result.affected !== 1)
        throw new RunPersistenceError('STALE_EXECUTION');
      return toRun(await this.readRow(manager, guard.runId));
    });
  }

  async recordProviderReference(
    guard: AttemptGuard,
    reference: string,
  ): Promise<GenerationRun> {
    return this.updateAttempt(guard, {
      providerInvocationRef: opaqueKey.parse(reference),
    });
  }

  async failRun(
    guard: AttemptGuard,
    input: RunFailure,
  ): Promise<GenerationRun> {
    const failure = runFailureContract.parse(input);
    if (
      failure.retryable &&
      !(
        (failure.code === 'LOCAL_PREPARATION_FAILED' &&
          failure.phase === 'BEFORE_PROVIDER') ||
        (failure.code === 'PROVIDER_REJECTED' && failure.phase === 'PROVIDER')
      )
    )
      throw new RunPersistenceError('INVALID_INPUT');
    return this.updateAttempt(guard, { status: 'FAILED', error: failure });
  }

  async retryFailedRun(
    runId: string,
    revision: number,
  ): Promise<GenerationRun> {
    return this.transaction(async (manager) => {
      const result = await manager
        .createQueryBuilder()
        .update(GenerationRunRecord)
        .set({ status: 'PENDING', revision: () => 'revision + 1' })
        .where(
          "run_id = :runId AND revision = :revision AND status = 'FAILED' AND error->>'retryable' = 'true'",
          { runId, revision },
        )
        .execute();
      if (result.affected !== 1)
        throw new RunPersistenceError('INVALID_TRANSITION');
      return toRun(await this.readRow(manager, runId));
    });
  }

  async recoverExpired(limit: number): Promise<readonly string[]> {
    checkLimit(limit, 100);
    return this.transaction(async (manager) => {
      const expired = await manager
        .getRepository(GenerationRunRecord)
        .createQueryBuilder('run')
        .where(
          "run.status = 'RUNNING' AND run.lease_expires_at <= clock_timestamp()",
        )
        .orderBy('run.lease_expires_at', 'ASC')
        .addOrderBy('run.run_id', 'ASC')
        .take(limit)
        .setLock('pessimistic_write')
        .setOnLocked('skip_locked')
        .getMany();
      for (const run of expired) {
        await manager
          .createQueryBuilder()
          .update(GenerationRunRecord)
          .set({ status: 'INTERRUPTED', revision: () => 'revision + 1' })
          .where('run_id = :runId', { runId: run.runId })
          .execute();
      }
      return expired.map((run) => run.runId);
    });
  }
}
