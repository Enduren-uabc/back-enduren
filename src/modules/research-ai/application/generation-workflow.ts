// Created by: Codex (AI-assisted), 2026-10-19
import { freeze } from '../domain/contract';
import { createTrainingProgramProposal } from '../domain/training-program-proposal';
import type { GenerationRun } from '../domain/generation-run';
import { RunPersistenceError } from '../domain/generation-run';
import type {
  AttemptGuard,
  RegisterRunInput,
  ResearchRunStore,
  StoredRun,
} from './run-persistence.port';
import type { ModelGateway, ModelObservation } from './model-gateway.port';
import type { ModelProfile } from './execution-policy';
import type {
  GenerationExecutionStore,
  ModelResult,
} from './generation-execution-store.port';

/** One durable intent permits one dispatch; reentry only reads an existing run. */
export class GenerationWorkflow {
  constructor(
    private readonly runs: ResearchRunStore,
    private readonly executions: GenerationExecutionStore,
    private readonly gateway: ModelGateway,
  ) {}

  async execute(
    input: RegisterRunInput,
    profile: ModelProfile,
    signal?: AbortSignal,
  ): Promise<GenerationRun> {
    if (input.configuration.schemaVersion !== 'generation-run-config/0.2')
      throw new RunPersistenceError('INVALID_INPUT');
    const registered = await this.runs.registerRun(input);
    if (registered.status !== 'PENDING') return registered;
    if (registered.configuration.schemaVersion !== 'generation-run-config/0.2')
      throw new RunPersistenceError('INVALID_INPUT');
    const configuration = registered.configuration;
    // Margin also allows a short result transaction after the HTTP deadline.
    const leaseSeconds =
      Math.ceil(configuration.execution.timeoutMs / 1000) + 30;
    const claimed = await this.runs.claimRun(
      registered.runId,
      registered.revision,
      leaseSeconds,
    );
    if (!claimed.attemptId)
      throw new RunPersistenceError('INTEGRITY_VIOLATION');
    const guard: AttemptGuard = {
      runId: claimed.runId,
      attemptId: claimed.attemptId,
      revision: claimed.revision,
    };
    const stored = await this.runs.getRun(claimed.runId);
    let prepared: ReturnType<ModelGateway['prepare']>;
    try {
      prepared = this.gateway.prepare(stored.envelope, configuration, profile);
    } catch {
      return this.runs.failRun(guard, {
        code: 'LOCAL_PREPARATION_FAILED',
        phase: 'BEFORE_PROVIDER',
        retryable: false,
      });
    }
    try {
      await this.executions.reserveInvocation(guard, prepared);
    } catch {
      // A connection can fail after COMMIT. Do not classify a durable intent as
      // a known local failure or grant another dispatch in that window.
      const durable = await this.executions.getInvocation(
        guard.runId,
        guard.attemptId,
      );
      if (durable) return (await this.runs.getRun(guard.runId)).run;
      return this.runs.failRun(guard, {
        code: 'LOCAL_PREPARATION_FAILED',
        phase: 'BEFORE_PROVIDER',
        retryable: false,
      });
    }
    let observation: ModelObservation;
    try {
      observation = await this.gateway.invoke(prepared, signal);
    } catch {
      // Never persist exception messages: they can contain credentials/payloads.
      observation = {
        kind: 'UNCERTAIN',
        reason: 'NETWORK_ERROR',
        publicText: null,
        refusal: null,
        responseId: null,
        requestId: null,
        modelId: null,
        httpStatus: null,
        usage: null,
      };
    }
    const result = this.classify(stored, guard, observation);
    // Only persistence may be repeated by a caller holding this result.
    // There is no HTTP retry here, including when this transaction fails.
    return this.executions.finalizeInvocation(guard, result);
  }

  classify(
    stored: StoredRun,
    guard: AttemptGuard,
    observation: ModelObservation,
  ): ModelResult {
    if (
      stored.run.runId !== guard.runId ||
      stored.run.attemptId !== guard.attemptId ||
      stored.run.revision !== guard.revision
    )
      throw new RunPersistenceError('STALE_EXECUTION');
    const base = {
      schemaVersion: 'model-result/0.1' as const,
      runId: guard.runId,
      attemptId: guard.attemptId,
      observation,
    };
    if (observation.kind !== 'COMPLETE' || observation.publicText === null) {
      return freeze({
        ...base,
        draft: null,
        outcome: observation.kind === 'UNCERTAIN' ? 'INTERRUPTED' : 'FAILED',
      });
    }
    const draft = {
      schemaVersion: 'raw-model-draft/0.1' as const,
      text: observation.publicText,
    };
    let value: unknown;
    try {
      value = JSON.parse(observation.publicText) as unknown;
    } catch {
      return freeze({
        ...base,
        draft: { ...draft, validation: 'INVALID_JSON', proposal: null },
        outcome: 'FAILED',
      });
    }
    try {
      value = this.gateway.decodeOutput(value);
    } catch {
      return freeze({
        ...base,
        draft: { ...draft, validation: 'INVALID_SCHEMA', proposal: null },
        outcome: 'FAILED',
      });
    }
    try {
      const proposal = createTrainingProgramProposal(
        value,
        stored.knowledge,
        stored.snapshot,
      );
      const task = stored.envelope.payload.instructions.task;
      if (
        proposal.horizon.weeks !== task.horizonWeeks ||
        proposal.schedule.format !== task.requestedRepresentation
      ) {
        throw new Error('TASK_MISMATCH');
      }
      return freeze({
        ...base,
        draft: { ...draft, validation: 'VALID', proposal },
        outcome: 'SUCCEEDED',
      });
    } catch {
      return freeze({
        ...base,
        draft: { ...draft, validation: 'INVALID_DOMAIN', proposal: null },
        outcome: 'FAILED',
      });
    }
  }
}
