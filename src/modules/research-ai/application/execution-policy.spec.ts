// Created by: Codex (AI-assisted), 2026-10-20
import {
  ExecutionAuthorization,
  modelProfileHash,
  observedCostMicros,
  reserveCostMicros,
  validateExecutionAuthorization,
  validateModelProfile,
} from './execution-policy';

import { syntheticProfile } from './fixtures/execution-policy.fixture';
const now = new Date('2026-10-19T00:00:00.000Z');
const authorization: ExecutionAuthorization = {
  schemaVersion: 'execution-authorization/0.1',
  id: 'offline-auth',
  scope: 'offline-scope',
  profile: syntheticProfile,
  maxCalls: 1,
  budgetMicros: 5_000_000,
  expiresAt: '2026-10-30T00:00:00.000Z',
};
describe('closed execution policy and conservative integer budgets', () => {
  it('freezes validated records and hashes equivalent profiles consistently', () => {
    const profile = validateModelProfile(syntheticProfile, now);
    expect(Object.isFrozen(profile)).toBe(true);
    expect(modelProfileHash(profile)).toBe(
      modelProfileHash({ ...syntheticProfile }),
    );
    expect(validateExecutionAuthorization(authorization, now)).toEqual(
      authorization,
    );
  });
  it.each([
    { extra: 'unknown' },
    { supportsResponses: false },
    { supportsStructuredOutputs: false },
    { verifiedAt: '2026-10-20T00:00:00.000Z' },
    { expiresAt: '2026-10-18T00:00:00.000Z' },
    { verifiedAt: '2026-02-30T00:00:00.000Z' },
    { pricingSource: 'https://example.com/rates' },
    { inputMicrosPerMillionTokens: -1 },
    { contextWindowTokens: Number.MAX_SAFE_INTEGER + 1 },
  ])('rejects insufficient or unknown profile evidence %j', (patch) => {
    expect(() =>
      validateModelProfile({ ...syntheticProfile, ...patch }, now),
    ).toThrow();
  });
  it.each([
    { budgetMicros: 5_000_001 },
    { maxCalls: 0 },
    { expiresAt: '2026-11-02T00:00:00.000Z' },
    { extra: true },
  ])('rejects invalid authorization %j', (patch) => {
    expect(() =>
      validateExecutionAuthorization({ ...authorization, ...patch }, now),
    ).toThrow();
  });
  it('rounds each input/output charge up and uses the full context as input bound', () => {
    expect(reserveCostMicros(syntheticProfile, 100_000, 10_000)).toBe(3);
    expect(
      observedCostMicros(syntheticProfile, {
        inputTokens: 1,
        outputTokens: 1,
        totalTokens: 2,
      }),
    ).toBe(2);
    expect(() => reserveCostMicros(syntheticProfile, 99_999, 1)).toThrow(
      'UNSAFE_TOKEN_BOUND',
    );
    expect(() => reserveCostMicros(syntheticProfile, 100_000, 10_001)).toThrow(
      'UNSAFE_TOKEN_BOUND',
    );
    expect(() =>
      observedCostMicros(syntheticProfile, {
        inputTokens: 1,
        outputTokens: 2,
        totalTokens: 9,
      }),
    ).toThrow('INVALID_USAGE');
  });
  it('blocks overflow without floating point intermediate multiplication', () => {
    const high = {
      ...syntheticProfile,
      contextWindowTokens: Number.MAX_SAFE_INTEGER,
      maxOutputTokens: Number.MAX_SAFE_INTEGER,
      inputMicrosPerMillionTokens: Number.MAX_SAFE_INTEGER,
    };
    expect(() => reserveCostMicros(high, Number.MAX_SAFE_INTEGER, 1)).toThrow(
      'COST_OVERFLOW',
    );
  });
  it.each([NaN, Infinity, -1, 1.1, Number.MAX_SAFE_INTEGER + 1])(
    'rejects non-integer or unsafe token and price values %j',
    (value) => {
      expect(() => reserveCostMicros(syntheticProfile, value, 1)).toThrow();
      expect(() =>
        reserveCostMicros(syntheticProfile, 100_000, value),
      ).toThrow();
      expect(() =>
        validateModelProfile(
          { ...syntheticProfile, inputMicrosPerMillionTokens: value },
          now,
        ),
      ).toThrow();
      expect(() =>
        observedCostMicros(syntheticProfile, {
          inputTokens: value,
          outputTokens: 0,
          totalTokens: value,
        }),
      ).toThrow();
    },
  );
  it('prices the safe integer boundary exactly and rejects invalid aggregate usage', () => {
    const profile = {
      ...syntheticProfile,
      inputMicrosPerMillionTokens: 1_000_000,
      outputMicrosPerMillionTokens: 1_000_000,
    };
    expect(
      observedCostMicros(profile, {
        inputTokens: Number.MAX_SAFE_INTEGER,
        outputTokens: 0,
        totalTokens: Number.MAX_SAFE_INTEGER,
      }),
    ).toBe(Number.MAX_SAFE_INTEGER);
    expect(() =>
      observedCostMicros(profile, {
        inputTokens: Number.MAX_SAFE_INTEGER,
        outputTokens: 1,
        totalTokens: Number.MAX_SAFE_INTEGER + 1,
      }),
    ).toThrow('INVALID_USAGE');
    expect(() =>
      validateModelProfile(
        { ...syntheticProfile, maxOutputTokens: 100_001 },
        now,
      ),
    ).toThrow('PROFILE_LIMITS_INVALID');
    expect(() => validateModelProfile(syntheticProfile, new Date(NaN))).toThrow(
      'PROFILE_NOT_CURRENT',
    );
  });
});
