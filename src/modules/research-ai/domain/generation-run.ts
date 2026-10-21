// Created by: Codex (AI-assisted), 2026-10-18
import {
  DeepReadonly,
  enumeration,
  numberContract,
  objectOf,
  oneOf,
  textContract,
  ValueOf,
  versionRef,
} from './contract';

export type RunStatus =
  | 'PENDING'
  | 'RUNNING'
  | 'FAILED'
  | 'INTERRUPTED'
  | 'SUCCEEDED';
export type RunEventKind =
  | 'REGISTERED'
  | 'CLAIMED'
  | 'PROVIDER_REFERENCED'
  | 'FAILED'
  | 'SUCCEEDED'
  | 'RETRY_SCHEDULED'
  | 'INTERRUPTED';

export const opaqueKey = textContract('^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$');
const legacyRunConfigurationContract = objectOf({
  schemaVersion: enumeration('generation-run-config/0.1'),
  workflow: versionRef,
  target: objectOf({
    providerId: opaqueKey,
    modelId: opaqueKey,
    maxOutputTokens: numberContract(1, true, 1_000_000),
    temperature: numberContract(0, false, 2),
  }),
});
export const executionRunConfigurationContract = objectOf({
  schemaVersion: enumeration('generation-run-config/0.2'),
  workflow: versionRef,
  target: objectOf({
    providerId: opaqueKey,
    modelId: opaqueKey,
    maxOutputTokens: numberContract(1, true, 1_000_000),
    temperature: oneOf(numberContract(0, false, 2), enumeration(null)),
  }),
  execution: objectOf({
    authorizationId: opaqueKey,
    profileHash: textContract('^[a-f0-9]{64}$'),
    gatewayVersion: textContract('^[A-Za-z0-9./_-]{1,128}$'),
    wireSchemaVersion: textContract('^[A-Za-z0-9./_-]{1,128}$'),
    maxInputTokens: numberContract(1, true, 100_000_000),
    maxRequestBytes: numberContract(1, true, 1_048_576),
    maxResponseBytes: numberContract(1, true, 1_048_576),
    timeoutMs: numberContract(1, true, 3_500_000),
  }),
});
export type ExecutionRunConfiguration = DeepReadonly<
  ValueOf<typeof executionRunConfigurationContract>
>;
export const runConfigurationContract = oneOf(
  legacyRunConfigurationContract,
  executionRunConfigurationContract,
);
export type RunConfiguration = DeepReadonly<
  ValueOf<typeof runConfigurationContract>
>;

export const runFailureContract = objectOf({
  code: enumeration(
    'LOCAL_PREPARATION_FAILED',
    'PROVIDER_REJECTED',
    'RESPONSE_INVALID',
    'UNEXPECTED_FAILURE',
  ),
  phase: enumeration('BEFORE_PROVIDER', 'PROVIDER', 'AFTER_PROVIDER'),
  retryable: enumeration(true, false),
});
export type RunFailure = DeepReadonly<ValueOf<typeof runFailureContract>>;
export type StoredRunFailure =
  | RunFailure
  | Readonly<{
      code: 'LEASE_EXPIRED' | 'EXTERNAL_OUTCOME_UNCERTAIN';
      phase: 'PROVIDER';
      retryable: false;
    }>;

export interface GenerationRun {
  readonly schemaVersion: 'generation-run/0.1' | 'generation-run/0.2';
  readonly runId: string;
  readonly idempotency: Readonly<{ scope: string; key: string }>;
  readonly requestHash: string;
  readonly snapshotHash: string;
  readonly contextHash: string;
  readonly envelopeHash: string;
  readonly configuration: RunConfiguration;
  readonly status: RunStatus;
  readonly revision: number;
  readonly attemptNumber: number;
  readonly attemptId: string | null;
  readonly providerInvocationRef: string | null;
  readonly leaseExpiresAt: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly startedAt: string | null;
  readonly finishedAt: string | null;
  readonly error: StoredRunFailure | null;
}

export interface RunEvent {
  readonly runId: string;
  readonly revision: number;
  readonly kind: RunEventKind;
  readonly fromStatus: RunStatus | null;
  readonly toStatus: RunStatus;
  readonly attemptId: string | null;
  readonly providerInvocationRef: string | null;
  readonly occurredAt: string;
  readonly error: StoredRunFailure | null;
}

export class RunPersistenceError extends Error {
  constructor(
    readonly code:
      | 'INVALID_INPUT'
      | 'INTEGRITY_VIOLATION'
      | 'IDENTITY_CONFLICT'
      | 'IDEMPOTENCY_CONFLICT'
      | 'NOT_FOUND'
      | 'STALE_EXECUTION'
      | 'STORAGE_FAILURE'
      | 'INVALID_TRANSITION',
    readonly sqlState?: string,
  ) {
    // Fixed codes prevent database payloads and provider exceptions leaking into callers/logs.
    super(code);
    this.name = 'RunPersistenceError';
  }
}
