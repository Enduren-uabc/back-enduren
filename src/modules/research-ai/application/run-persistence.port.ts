// Created by: Codex (AI-assisted), 2026-10-18
import type { ResearchCaseSnapshot } from '../domain/extended-case-state';
import type { KnowledgeRelease } from '../domain/knowledge-release';
import type {
  GenerationRun,
  RunConfiguration,
  RunEvent,
  RunFailure,
} from '../domain/generation-run';
import type { ContextPacket } from './context-intelligence';
import type { PromptEnvelope } from './prompt-envelope';

export interface RunArtifacts {
  readonly snapshot: ResearchCaseSnapshot;
  readonly knowledge: KnowledgeRelease;
  readonly context: ContextPacket;
  readonly envelope: PromptEnvelope;
}
export interface RegisterRunInput extends RunArtifacts {
  readonly idempotency: Readonly<{ scope: string; key: string }>;
  readonly configuration: RunConfiguration;
}
export interface StoredRun extends RunArtifacts {
  readonly run: GenerationRun;
  readonly events: readonly RunEvent[];
}
export interface AttemptGuard {
  readonly runId: string;
  readonly revision: number;
  readonly attemptId: string;
}

export interface ResearchArtifactReader {
  getCaseSnapshot(hash: string): Promise<ResearchCaseSnapshot>;
  getKnowledgeRelease(hash: string): Promise<KnowledgeRelease>;
  getContextPacket(hash: string): Promise<ContextPacket>;
  getPromptEnvelope(hash: string): Promise<PromptEnvelope>;
}

/** Internal trusted boundary: authorization belongs to the future caller, not an idempotency key. */
export interface ResearchRunStore extends ResearchArtifactReader {
  registerRun(input: RegisterRunInput): Promise<GenerationRun>;
  getRun(runId: string): Promise<StoredRun>;
  listPending(limit: number): Promise<readonly string[]>;
  claimRun(
    runId: string,
    revision: number,
    leaseSeconds: number,
  ): Promise<GenerationRun>;
  recordProviderReference(
    guard: AttemptGuard,
    reference: string,
  ): Promise<GenerationRun>;
  failRun(guard: AttemptGuard, failure: RunFailure): Promise<GenerationRun>;
  retryFailedRun(runId: string, revision: number): Promise<GenerationRun>;
  recoverExpired(limit: number): Promise<readonly string[]>;
}
export const RESEARCH_RUN_STORE = Symbol('RESEARCH_RUN_STORE');
