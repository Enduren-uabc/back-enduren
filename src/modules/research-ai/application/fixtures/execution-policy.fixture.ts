// Created by: Codex (AI-assisted), 2026-10-20
import { ModelProfile } from '../execution-policy';

// Deliberately synthetic figures, not a model or tariff offered by the provider.
export const syntheticProfile: ModelProfile = {
  schemaVersion: 'model-profile/0.1',
  kind: 'SYNTHETIC_TEST',
  providerId: 'openai',
  modelId: 'offline-model',
  contextWindowTokens: 100_000,
  maxOutputTokens: 10_000,
  supportsResponses: true,
  supportsStructuredOutputs: true,
  supportsTemperature: false,
  inputMicrosPerMillionTokens: 17,
  outputMicrosPerMillionTokens: 29,
  capabilitySource: 'https://developers.openai.com/offline-test-fixture',
  pricingSource: 'https://developers.openai.com/offline-test-fixture',
  verifiedAt: '2026-10-01T00:00:00.000Z',
  expiresAt: '2026-11-01T00:00:00.000Z',
};
