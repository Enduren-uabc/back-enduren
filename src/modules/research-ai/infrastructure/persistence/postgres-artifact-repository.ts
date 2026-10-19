// Created by: Codex (AI-assisted), 2026-10-18
import { EntityManager } from 'typeorm';
import type { EntitySchema, FindOptionsWhere, ObjectLiteral } from 'typeorm';
import { stableSerialize } from '../../domain/contract';
import { validateCaseSnapshot } from '../../domain/extended-case-state';
import type { ResearchCaseSnapshot } from '../../domain/extended-case-state';
import { createKnowledgeRelease } from '../../domain/knowledge-release';
import { RunPersistenceError } from '../../domain/generation-run';
import {
  buildContextPacket,
  contentHash,
} from '../../application/context-intelligence';
import type { ContextPacket } from '../../application/context-intelligence';
import { buildPromptEnvelope } from '../../application/prompt-envelope';
import type { PromptEnvelope } from '../../application/prompt-envelope';
import {
  assertEquivalent,
  prepareRegistration,
} from '../../application/persisted-artifacts';
import type { ResearchArtifactReader } from '../../application/run-persistence.port';
import {
  CaseSnapshotRecord,
  KnowledgeReleaseRecord,
  ContextPacketRecord,
  PromptEnvelopeRecord,
} from './research-records';
import type { ArtifactRecord } from './research-records';

export function readDocument(record: ArtifactRecord): unknown {
  try {
    const value: unknown = JSON.parse(record.canonical);
    if (
      stableSerialize(value) !== record.canonical ||
      contentHash(value) !== record.hash
    ) {
      throw new RunPersistenceError('INTEGRITY_VIOLATION');
    }
    return value;
  } catch {
    throw new RunPersistenceError('INTEGRITY_VIOLATION');
  }
}

/** Uses the caller's transaction manager; never opens an independent transaction. */
export class PostgresArtifactRepository implements ResearchArtifactReader {
  constructor(private readonly manager: EntityManager) {}

  private async find<T extends ArtifactRecord>(
    entity: EntitySchema<T>,
    hash: string,
  ): Promise<T> {
    const row = await this.manager
      .getRepository(entity)
      .findOneBy({ hash } as FindOptionsWhere<T>);
    if (!row) throw new RunPersistenceError('NOT_FOUND');
    return row;
  }

  private async insert<T extends ArtifactRecord & ObjectLiteral>(
    entity: EntitySchema<T>,
    record: T,
  ): Promise<void> {
    await this.manager
      .createQueryBuilder()
      .insert()
      .into(entity)
      .values(record)
      .orIgnore()
      .execute();
    const stored = await this.manager
      .getRepository(entity)
      .findOneBy({ hash: record.hash } as FindOptionsWhere<T>);
    if (!stored || stored.canonical !== record.canonical) {
      throw new RunPersistenceError('IDENTITY_CONFLICT');
    }
  }

  async saveBundle(
    prepared: ReturnType<typeof prepareRegistration>,
  ): Promise<void> {
    const { artifacts: a, hashes: h } = prepared;
    await this.insert(CaseSnapshotRecord, {
      hash: h.snapshotHash,
      canonical: stableSerialize(a.snapshot),
      snapshotId: a.snapshot.snapshotId,
      caseId: a.snapshot.caseId,
    });
    await this.insert(KnowledgeReleaseRecord, {
      hash: h.knowledgeHash,
      canonical: stableSerialize(a.knowledge),
      releaseId: a.knowledge.ref.id,
      releaseVersion: a.knowledge.ref.version,
    });
    await this.insert(ContextPacketRecord, {
      hash: h.contextHash,
      canonical: stableSerialize(a.context),
      packetId: a.context.packetId,
      snapshotHash: h.snapshotHash,
      knowledgeHash: h.knowledgeHash,
    });
    await this.insert(PromptEnvelopeRecord, {
      hash: h.envelopeHash,
      canonical: stableSerialize(a.envelope),
      envelopeId: a.envelope.envelopeId,
      contextHash: h.contextHash,
    });
  }

  async getCaseSnapshot(hash: string) {
    const row = await this.find(CaseSnapshotRecord, hash);
    const value = readDocument(row);
    const snapshot = validateCaseSnapshot(value as ResearchCaseSnapshot);
    assertEquivalent(value, snapshot);
    if (
      snapshot.snapshotId !== row.snapshotId ||
      snapshot.caseId !== row.caseId
    ) {
      throw new RunPersistenceError('INTEGRITY_VIOLATION');
    }
    return snapshot;
  }

  async getKnowledgeRelease(hash: string) {
    const row = await this.find(KnowledgeReleaseRecord, hash);
    const value = readDocument(row);
    const knowledge = createKnowledgeRelease(value);
    assertEquivalent(value, knowledge);
    if (
      knowledge.ref.id !== row.releaseId ||
      knowledge.ref.version !== row.releaseVersion
    ) {
      throw new RunPersistenceError('INTEGRITY_VIOLATION');
    }
    return knowledge;
  }

  async getContextPacket(hash: string) {
    const row = await this.find(ContextPacketRecord, hash);
    const value = readDocument(row) as ContextPacket;
    const snapshot = await this.getCaseSnapshot(row.snapshotHash);
    const knowledge = await this.getKnowledgeRelease(row.knowledgeHash);
    const packet = buildContextPacket(
      snapshot,
      knowledge,
      value.content.policy,
    );
    assertEquivalent(value, packet);
    if (packet.packetId !== row.packetId)
      throw new RunPersistenceError('INTEGRITY_VIOLATION');
    return packet;
  }

  async getPromptEnvelope(hash: string) {
    const row = await this.find(PromptEnvelopeRecord, hash);
    const value = readDocument(row) as PromptEnvelope;
    const packet = await this.getContextPacket(row.contextHash);
    const { ref, task, directives } = value.payload.instructions;
    const envelope = buildPromptEnvelope(packet, { ref, task, directives });
    assertEquivalent(value, envelope);
    if (envelope.envelopeId !== row.envelopeId)
      throw new RunPersistenceError('INTEGRITY_VIOLATION');
    return envelope;
  }
}
