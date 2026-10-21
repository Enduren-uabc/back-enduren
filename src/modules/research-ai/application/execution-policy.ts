// Created by: Codex (AI-assisted), 2026-10-20
import {
  DeepReadonly,
  ValueOf,
  enumeration,
  freeze,
  invariant,
  numberContract,
  objectOf,
  textContract,
} from '../domain/contract';
import { contentHash } from './context-intelligence';
import { TokenUsage } from './model-gateway.port';

const safePositive = numberContract(1, true, Number.MAX_SAFE_INTEGER);
const safeNonnegative = numberContract(0, true, Number.MAX_SAFE_INTEGER);
const identity = textContract('^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$');
const timestamp = textContract(
  '^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}\\.\\d{3}Z$',
);
const officialSource = textContract(
  '^https://developers\\.openai\\.com/[^\\s]+$',
);
export const modelProfileContract = objectOf({
  schemaVersion: enumeration('model-profile/0.1'),
  kind: enumeration('VERIFIED', 'SYNTHETIC_TEST'),
  providerId: enumeration('openai'),
  modelId: identity,
  contextWindowTokens: safePositive,
  maxOutputTokens: safePositive,
  supportsResponses: enumeration(true),
  supportsStructuredOutputs: enumeration(true),
  supportsTemperature: enumeration(true, false),
  inputMicrosPerMillionTokens: safeNonnegative,
  outputMicrosPerMillionTokens: safeNonnegative,
  capabilitySource: officialSource,
  pricingSource: officialSource,
  verifiedAt: timestamp,
  expiresAt: timestamp,
});
export type ModelProfile = DeepReadonly<ValueOf<typeof modelProfileContract>>;
export const executionAuthorizationContract = objectOf({
  schemaVersion: enumeration('execution-authorization/0.1'),
  id: identity,
  scope: identity,
  profile: modelProfileContract,
  maxCalls: numberContract(1, true, 1_000_000),
  budgetMicros: numberContract(1, true, 5_000_000),
  expiresAt: timestamp,
});
export type ExecutionAuthorization = DeepReadonly<
  ValueOf<typeof executionAuthorizationContract>
>;
function validDate(value: string): number {
  const time = Date.parse(value);
  invariant(
    Number.isFinite(time) && new Date(time).toISOString() === value,
    'INVALID_PROFILE_DATE',
  );
  return time;
}
/** Evidence is reviewed internal configuration, never accepted from a request body. */
export function validateModelProfile(
  input: unknown,
  now = new Date(),
): ModelProfile {
  const profile = modelProfileContract.parse(input);
  invariant(
    validDate(profile.verifiedAt) <= now.getTime() &&
      validDate(profile.expiresAt) > now.getTime(),
    'PROFILE_NOT_CURRENT',
  );
  invariant(
    profile.maxOutputTokens <= profile.contextWindowTokens,
    'PROFILE_LIMITS_INVALID',
  );
  return freeze(profile);
}
export function validateExecutionAuthorization(
  input: unknown,
  now = new Date(),
): ExecutionAuthorization {
  const auth = executionAuthorizationContract.parse(input);
  validateModelProfile(auth.profile, now);
  invariant(
    validDate(auth.expiresAt) > now.getTime() &&
      validDate(auth.expiresAt) <= validDate(auth.profile.expiresAt),
    'AUTHORIZATION_NOT_CURRENT',
  );
  return freeze(auth);
}
export function modelProfileHash(profile: ModelProfile): string {
  return contentHash(modelProfileContract.parse(profile));
}
function pricedTokens(tokens: number, microsPerMillion: number): bigint {
  safeNonnegative.parse(tokens);
  safeNonnegative.parse(microsPerMillion);
  return (BigInt(tokens) * BigInt(microsPerMillion) + 999_999n) / 1_000_000n;
}
function estimatedCost(
  profile: ModelProfile,
  inputTokens: number,
  outputTokens: number,
): number {
  modelProfileContract.parse(profile);
  const micros =
    pricedTokens(inputTokens, profile.inputMicrosPerMillionTokens) +
    pricedTokens(outputTokens, profile.outputMicrosPerMillionTokens);
  invariant(micros <= BigInt(Number.MAX_SAFE_INTEGER), 'COST_OVERFLOW');
  return Number(micros);
}
export function reserveCostMicros(
  profile: ModelProfile,
  maxInputTokens: number,
  maxOutputTokens: number,
): number {
  safePositive.parse(maxInputTokens);
  safePositive.parse(maxOutputTokens);
  invariant(
    maxInputTokens >= profile.contextWindowTokens &&
      maxOutputTokens <= profile.maxOutputTokens,
    'UNSAFE_TOKEN_BOUND',
  );
  return estimatedCost(profile, maxInputTokens, maxOutputTokens);
}
export function observedCostMicros(
  profile: ModelProfile,
  usage: TokenUsage,
): number {
  invariant(
    Number.isSafeInteger(usage.totalTokens) &&
      usage.totalTokens === usage.inputTokens + usage.outputTokens,
    'INVALID_USAGE',
  );
  return estimatedCost(profile, usage.inputTokens, usage.outputTokens);
}
