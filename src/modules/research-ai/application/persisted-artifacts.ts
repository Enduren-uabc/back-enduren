// Created by: Codex (AI-assisted), 2026-10-18
import { stableSerialize } from '../domain/contract';
import { validateCaseSnapshot } from '../domain/extended-case-state';
import { createKnowledgeRelease } from '../domain/knowledge-release';
import {
  opaqueKey,
  RunPersistenceError,
  runConfigurationContract,
} from '../domain/generation-run';
import { buildContextPacket, contentHash } from './context-intelligence';
import { buildPromptEnvelope } from './prompt-envelope';
import type { RegisterRunInput, RunArtifacts } from './run-persistence.port';

export function assertEquivalent(actual: unknown, expected: unknown): void {
  if (stableSerialize(actual) !== stableSerialize(expected)) {
    throw new RunPersistenceError('INTEGRITY_VIOLATION');
  }
}

/** Replays S1A to verify relationships, selection and all envelope sections, not just supplied hashes. */
export function validateArtifactBundle(input: RunArtifacts): RunArtifacts {
  try {
    const snapshot = validateCaseSnapshot(input.snapshot);
    const knowledge = createKnowledgeRelease(input.knowledge);
    assertEquivalent(input.snapshot, snapshot);
    assertEquivalent(input.knowledge, knowledge);
    const context = buildContextPacket(
      snapshot,
      knowledge,
      input.context.content.policy,
    );
    assertEquivalent(input.context, context);
    const { ref, directives, task } = input.envelope.payload.instructions;
    const envelope = buildPromptEnvelope(context, { ref, directives, task });
    assertEquivalent(input.envelope, envelope);
    return { snapshot, knowledge, context, envelope };
  } catch {
    throw new RunPersistenceError('INTEGRITY_VIOLATION');
  }
}

export function prepareRegistration(input: RegisterRunInput) {
  const artifacts = validateArtifactBundle(input);
  try {
    const scope = opaqueKey.parse(input.idempotency.scope);
    const key = opaqueKey.parse(input.idempotency.key);
    const configuration = runConfigurationContract.parse(input.configuration);
    const hashes = {
      snapshotHash: contentHash(artifacts.snapshot),
      knowledgeHash: contentHash(artifacts.knowledge),
      contextHash: contentHash(artifacts.context),
      envelopeHash: contentHash(artifacts.envelope),
    };
    for (const artifact of Object.values(artifacts)) {
      if (Buffer.byteLength(stableSerialize(artifact), 'utf8') > 1_048_576) {
        throw new RunPersistenceError('INVALID_INPUT');
      }
    }
    return {
      artifacts,
      hashes,
      scope,
      key,
      configuration,
      configurationHash: contentHash(configuration),
      requestHash: contentHash({ ...hashes, configuration }),
    };
  } catch {
    throw new RunPersistenceError('INVALID_INPUT');
  }
}
