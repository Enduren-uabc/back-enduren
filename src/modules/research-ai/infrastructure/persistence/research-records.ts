// Created by: Codex (AI-assisted), 2026-10-18
import { EntitySchema } from 'typeorm';
import type { EntitySchemaColumnOptions } from 'typeorm';
import type {
  RunEventKind,
  RunStatus,
  StoredRunFailure,
} from '../../domain/generation-run';

export interface ArtifactRecord {
  hash: string;
  canonical: string;
}
export interface SnapshotRecord extends ArtifactRecord {
  snapshotId: string;
  caseId: string;
}
export interface KnowledgeRecord extends ArtifactRecord {
  releaseId: string;
  releaseVersion: string;
}
export interface ContextRecord extends ArtifactRecord {
  packetId: string;
  snapshotHash: string;
  knowledgeHash: string;
}
export interface EnvelopeRecord extends ArtifactRecord {
  envelopeId: string;
  contextHash: string;
}
export interface RunRecord {
  runId: string;
  scope: string;
  idempotencyKey: string;
  requestHash: string;
  snapshotHash: string;
  contextHash: string;
  envelopeHash: string;
  configurationCanonical: string;
  configurationHash: string;
  status: RunStatus;
  revision: number;
  attemptNumber: number;
  attemptId: string | null;
  providerInvocationRef: string | null;
  leaseExpiresAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  startedAt: Date | null;
  finishedAt: Date | null;
  error: StoredRunFailure | null;
}
export interface EventRecord {
  runId: string;
  revision: number;
  kind: RunEventKind;
  fromStatus: RunStatus | null;
  toStatus: RunStatus;
  attemptId: string | null;
  providerInvocationRef: string | null;
  occurredAt: Date;
  error: StoredRunFailure | null;
}
const text = (name: string, nullable = false): EntitySchemaColumnOptions => ({
  type: 'text',
  name,
  nullable,
});
const date = (name: string, nullable = false): EntitySchemaColumnOptions => ({
  type: 'timestamptz',
  name,
  nullable,
});
const artifactColumns = {
  hash: { ...text('hash'), primary: true },
  canonical: text('canonical'),
};

export const CaseSnapshotRecord = new EntitySchema<SnapshotRecord>({
  name: 'ResearchCaseSnapshot',
  schema: 'research_ai',
  tableName: 'case_snapshots',
  columns: {
    ...artifactColumns,
    snapshotId: text('snapshot_id'),
    caseId: text('case_id'),
  },
});
export const KnowledgeReleaseRecord = new EntitySchema<KnowledgeRecord>({
  name: 'ResearchKnowledgeRelease',
  schema: 'research_ai',
  tableName: 'knowledge_releases',
  columns: {
    ...artifactColumns,
    releaseId: text('release_id'),
    releaseVersion: text('release_version'),
  },
});
export const ContextPacketRecord = new EntitySchema<ContextRecord>({
  name: 'ResearchContextPacket',
  schema: 'research_ai',
  tableName: 'context_packets',
  columns: {
    ...artifactColumns,
    packetId: text('packet_id'),
    snapshotHash: text('snapshot_hash'),
    knowledgeHash: text('knowledge_hash'),
  },
});
export const PromptEnvelopeRecord = new EntitySchema<EnvelopeRecord>({
  name: 'ResearchPromptEnvelope',
  schema: 'research_ai',
  tableName: 'prompt_envelopes',
  columns: {
    ...artifactColumns,
    envelopeId: text('envelope_id'),
    contextHash: text('context_hash'),
  },
});
export const GenerationRunRecord = new EntitySchema<RunRecord>({
  name: 'ResearchGenerationRun',
  schema: 'research_ai',
  tableName: 'generation_runs',
  columns: {
    runId: { type: 'uuid', name: 'run_id', primary: true },
    scope: text('scope'),
    idempotencyKey: text('idempotency_key'),
    requestHash: text('request_hash'),
    snapshotHash: text('snapshot_hash'),
    contextHash: text('context_hash'),
    envelopeHash: text('envelope_hash'),
    configurationCanonical: text('configuration_canonical'),
    configurationHash: text('configuration_hash'),
    status: text('status'),
    revision: { type: 'integer' },
    attemptNumber: { type: 'integer', name: 'attempt_number' },
    attemptId: { type: 'uuid', name: 'attempt_id', nullable: true },
    providerInvocationRef: text('provider_invocation_ref', true),
    leaseExpiresAt: date('lease_expires_at', true),
    createdAt: date('created_at'),
    updatedAt: date('updated_at'),
    startedAt: date('started_at', true),
    finishedAt: date('finished_at', true),
    error: { type: 'jsonb', nullable: true },
  },
});
export const RunEventRecord = new EntitySchema<EventRecord>({
  name: 'ResearchRunEvent',
  schema: 'research_ai',
  tableName: 'run_events',
  columns: {
    runId: { type: 'uuid', name: 'run_id', primary: true },
    revision: { type: 'integer', primary: true },
    kind: text('kind'),
    fromStatus: text('from_status', true),
    toStatus: text('to_status'),
    attemptId: { type: 'uuid', name: 'attempt_id', nullable: true },
    providerInvocationRef: text('provider_invocation_ref', true),
    occurredAt: date('occurred_at'),
    error: { type: 'jsonb', nullable: true },
  },
});
export const RESEARCH_ENTITIES = [
  CaseSnapshotRecord,
  KnowledgeReleaseRecord,
  ContextPacketRecord,
  PromptEnvelopeRecord,
  GenerationRunRecord,
  RunEventRecord,
];
