// Created by: Codex (AI-assisted), 2026-10-19
import type { GenerationRun } from '../domain/generation-run';
import type { TrainingProgramProposal } from '../domain/training-program-proposal';
import type { ExecutionAuthorization } from './execution-policy';
import type {
  ModelObservation,
  PreparedModelRequest,
} from './model-gateway.port';
import type { AttemptGuard } from './run-persistence.port';

export interface RawModelDraft {
  readonly schemaVersion: 'raw-model-draft/0.1';
  readonly text: string;
  readonly validation:
    | 'VALID'
    | 'INVALID_JSON'
    | 'INVALID_SCHEMA'
    | 'INVALID_DOMAIN';
  readonly proposal: TrainingProgramProposal | null;
}
export interface ModelResult {
  readonly schemaVersion: 'model-result/0.1';
  readonly runId: string;
  readonly attemptId: string;
  readonly observation: ModelObservation;
  readonly draft: RawModelDraft | null;
  readonly outcome: 'SUCCEEDED' | 'FAILED' | 'INTERRUPTED';
}
export interface StoredInvocation {
  readonly runId: string;
  readonly attemptId: string;
  readonly claimRevision: number;
  readonly authorizationId: string;
  readonly prepared: PreparedModelRequest;
  readonly reservedMicros: number;
  readonly createdAt: string;
}
/** A successful reservation grants exactly one dispatch. Replays never grant it again. */
export interface GenerationExecutionStore {
  authorize(policy: ExecutionAuthorization): Promise<void>;
  reserveInvocation(
    guard: AttemptGuard,
    prepared: PreparedModelRequest,
  ): Promise<StoredInvocation>;
  finalizeInvocation(
    guard: AttemptGuard,
    result: ModelResult,
  ): Promise<GenerationRun>;
  getInvocation(
    runId: string,
    attemptId: string,
  ): Promise<StoredInvocation | null>;
  getResult(runId: string, attemptId: string): Promise<ModelResult | null>;
}
