// Created by: Codex (AI-assisted), 2026-10-18
import { buildRtF04Example } from '../fixtures/rt-f04.fixture';
import {
  prepareRegistration,
  validateArtifactBundle,
} from './persisted-artifacts';
import { buildContextPacket, contentHash } from './context-intelligence';
import { stableSerialize } from '../domain/contract';
import type { RegisterRunInput } from './run-persistence.port';

function input(): RegisterRunInput {
  const fixture = buildRtF04Example();
  return {
    snapshot: fixture.snapshot,
    knowledge: fixture.knowledge,
    context: fixture.packet,
    envelope: fixture.envelope,
    configuration: {
      schemaVersion: 'generation-run-config/0.1',
      workflow: { id: 'rt-workflow', version: 's1b-test' },
      target: {
        providerId: 'unconfigured',
        modelId: 'unconfigured',
        maxOutputTokens: 1024,
        temperature: 0,
      },
    },
    idempotency: { scope: 'synthetic-tests', key: 'test-1' },
  };
}

describe('S1B artifact admission boundary', () => {
  it('preserves the exact S1A payloads and yields repeatable request hashes', () => {
    const request = input();
    const first = prepareRegistration(request);
    expect(prepareRegistration(request)).toEqual(first);
    expect(stableSerialize(first.artifacts.snapshot)).toBe(
      stableSerialize(request.snapshot),
    );
    expect(first.hashes.contextHash).toBe(contentHash(request.context));
    expect(first.hashes.contextHash).not.toBe(request.context.contentHash);
  });

  it('rejects extra snapshot attributes rather than silently discarding them', () => {
    const request = input();
    expect(() =>
      prepareRegistration({
        ...request,
        snapshot: {
          ...request.snapshot,
          email: 'synthetic@example.invalid',
        },
      } as unknown as RegisterRunInput),
    ).toThrow('INTEGRITY_VIOLATION');
  });

  it('rejects a self-consistent packet compiled from a different snapshot', () => {
    const request = input();
    const different = { ...request.snapshot, snapshotId: 'different-snapshot' };
    const packet = buildContextPacket(
      different,
      request.knowledge,
      request.context.content.policy,
    );
    expect(() =>
      validateArtifactBundle({ ...request, context: packet }),
    ).toThrow('INTEGRITY_VIOLATION');
  });

  it('rejects changed envelope sections even when their supplied hash is recomputed', () => {
    const request = input();
    const payload = {
      ...request.envelope.payload,
      caseInformation: {
        ...request.envelope.payload.caseInformation,
        fields: [],
      },
    };
    const hash = contentHash(payload);
    expect(() =>
      validateArtifactBundle({
        ...request,
        envelope: { payload, contentHash: hash, envelopeId: `env-${hash}` },
      }),
    ).toThrow('INTEGRITY_VIOLATION');
  });

  it('rejects provider credentials and arbitrary parameter dictionaries', () => {
    const request = input();
    expect(() =>
      prepareRegistration({
        ...request,
        configuration: {
          ...request.configuration,
          apiKey: 'synthetic-test-marker',
        },
      } as RegisterRunInput),
    ).toThrow('INVALID_INPUT');
  });

  it('treats changed workflow/model configuration as a different logical request', () => {
    const request = input();
    const original = prepareRegistration(request);
    expect(
      prepareRegistration({
        ...request,
        configuration: {
          ...request.configuration,
          target: { ...request.configuration.target, maxOutputTokens: 2048 },
        },
      }).requestHash,
    ).not.toBe(original.requestHash);
  });
});
