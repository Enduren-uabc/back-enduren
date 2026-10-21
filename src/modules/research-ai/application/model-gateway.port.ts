// Created by: Codex (AI-assisted), 2026-10-20
import { ExecutionRunConfiguration } from '../domain/generation-run';
import { ModelProfile } from './execution-policy';
import { PromptEnvelope } from './prompt-envelope';

export interface PreparedModelRequest {
  readonly schemaVersion: 'prepared-model-request/0.1';
  readonly gatewayVersion: string;
  readonly wireSchemaVersion: string;
  readonly bodyCanonical: string;
  readonly requestHash: string;
  readonly envelopeHash: string;
  readonly modelId: string;
  readonly maxOutputTokens: number;
  readonly maxInputTokens: number;
  readonly maxRequestBytes: number;
  readonly maxResponseBytes: number;
  readonly timeoutMs: number;
  readonly profileHash: string;
  readonly profileKind: ModelProfile['kind'];
}
export interface TokenUsage {
  readonly inputTokens: number;
  readonly outputTokens: number;
  readonly totalTokens: number;
}
export type ObservationKind =
  | 'COMPLETE'
  | 'REFUSAL'
  | 'INCOMPLETE'
  | 'PROVIDER_FAILED'
  | 'HTTP_REJECTED'
  | 'UNCERTAIN'
  | 'NOT_SENT'
  | 'INVALID_RESPONSE';
export type ObservationReason =
  | 'DISABLED'
  | 'MISSING_CREDENTIAL'
  | 'INVALID_PREPARED_REQUEST'
  | 'PROFILE_EXPIRED'
  | 'SYNTHETIC_PROFILE'
  | 'ALREADY_INVOKED'
  | 'CANCELLED'
  | 'TIMEOUT'
  | 'NETWORK_ERROR'
  | 'RESPONSE_TOO_LARGE'
  | 'AUTHENTICATION'
  | 'RATE_LIMIT'
  | 'HTTP_ERROR'
  | 'SERVER_ERROR'
  | 'MALFORMED_RESPONSE'
  | 'SECRET_ECHO'
  | 'MAX_OUTPUT_TOKENS'
  | 'CONTENT_FILTER'
  | 'PROVIDER_FAILURE';
export interface ModelObservation {
  readonly kind: ObservationKind;
  readonly publicText: string | null;
  readonly refusal: string | null;
  readonly responseId: string | null;
  readonly requestId: string | null;
  readonly modelId: string | null;
  readonly httpStatus: number | null;
  readonly usage: TokenUsage | null;
  readonly reason: ObservationReason | null;
}
export interface ModelGateway {
  decodeOutput(value: unknown): unknown;
  prepare(
    envelope: PromptEnvelope,
    configuration: ExecutionRunConfiguration,
    profile: ModelProfile,
  ): PreparedModelRequest;
  invoke(
    prepared: PreparedModelRequest,
    signal?: AbortSignal,
  ): Promise<ModelObservation>;
}
