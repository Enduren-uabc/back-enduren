// Created by: Codex (AI-assisted), 2026-10-20
import { contentHash } from '../../application/context-intelligence';
import {
  ModelProfile,
  modelProfileHash,
  reserveCostMicros,
  validateModelProfile,
} from '../../application/execution-policy';
import {
  ModelGateway,
  ModelObservation,
  ObservationKind,
  ObservationReason,
  PreparedModelRequest,
  TokenUsage,
} from '../../application/model-gateway.port';
import {
  PromptEnvelope,
  serializePromptEnvelope,
} from '../../application/prompt-envelope';
import { freeze, invariant, stableSerialize } from '../../domain/contract';
import {
  ExecutionRunConfiguration,
  executionRunConfigurationContract,
} from '../../domain/generation-run';
import {
  HttpsResponsesTransport,
  ResponsesTransport,
} from './https-responses-transport';
import {
  decodeRTWire,
  OPENAI_RT_WIRE_SCHEMA,
  OPENAI_RT_WIRE_VERSION,
} from './openai-rt-wire';

export const OPENAI_RESPONSES_GATEWAY_VERSION = 'openai-responses-gateway/0.1';
export interface OpenAIGatewayOptions {
  readonly transport?: ResponsesTransport;
  readonly externalExecutionEnabled?: () => boolean;
  readonly credential?: () => string | undefined;
  readonly now?: () => Date;
}
const observation = (
  kind: ObservationKind,
  reason: ObservationReason | null = null,
  fields: Partial<ModelObservation> = {},
): ModelObservation =>
  freeze({
    kind,
    reason,
    publicText: null,
    refusal: null,
    responseId: null,
    requestId: null,
    modelId: null,
    httpStatus: null,
    usage: null,
    ...fields,
  });
function record(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}
function safeId(value: unknown): string | null {
  return typeof value === 'string' &&
    /^[A-Za-z0-9][A-Za-z0-9._:-]{0,255}$/.test(value)
    ? value
    : null;
}
function usageOf(value: unknown): TokenUsage | null {
  const item = record(value);
  if (!item) return null;
  const input = item.input_tokens;
  const output = item.output_tokens;
  const total = item.total_tokens;
  if (
    typeof input !== 'number' ||
    typeof output !== 'number' ||
    typeof total !== 'number' ||
    ![input, output, total].every((n) => Number.isSafeInteger(n) && n >= 0) ||
    input + output !== total
  )
    return null;
  return freeze({
    inputTokens: input,
    outputTokens: output,
    totalTokens: total,
  });
}
export class OpenAIResponsesGateway implements ModelGateway {
  private readonly transport: ResponsesTransport;
  private readonly enabled: () => boolean;
  private readonly credential: () => string | undefined;
  private readonly now: () => Date;
  private readonly prepared = new WeakMap<PreparedModelRequest, ModelProfile>();
  private readonly used = new WeakSet<PreparedModelRequest>();
  constructor(options: OpenAIGatewayOptions = {}) {
    this.transport = options.transport ?? new HttpsResponsesTransport();
    this.enabled = options.externalExecutionEnabled ?? (() => false);
    this.credential = options.credential ?? (() => undefined);
    this.now = options.now ?? (() => new Date());
  }
  decodeOutput(value: unknown): unknown {
    try {
      return decodeRTWire(value);
    } catch {
      throw new Error('INVALID_WIRE_OUTPUT');
    }
  }
  prepare(
    envelope: PromptEnvelope,
    configuration: ExecutionRunConfiguration,
    profileInput: ModelProfile,
  ): PreparedModelRequest {
    const config = executionRunConfigurationContract.parse(configuration);
    const profile = validateModelProfile(profileInput, this.now());
    serializePromptEnvelope(envelope);
    invariant(
      config.target.providerId === 'openai' &&
        config.target.modelId === profile.modelId,
      'MODEL_PROFILE_MISMATCH',
    );
    invariant(
      config.execution.profileHash === modelProfileHash(profile),
      'PROFILE_HASH_MISMATCH',
    );
    invariant(
      config.execution.gatewayVersion === OPENAI_RESPONSES_GATEWAY_VERSION &&
        config.execution.wireSchemaVersion === OPENAI_RT_WIRE_VERSION,
      'UNSUPPORTED_GATEWAY_VERSION',
    );
    invariant(
      config.target.temperature === null || profile.supportsTemperature,
      'UNSUPPORTED_TEMPERATURE',
    );
    reserveCostMicros(
      profile,
      config.execution.maxInputTokens,
      config.target.maxOutputTokens,
    );
    invariant(
      envelope.payload.instructions.trust === 'CONFIGURED_INSTRUCTIONS',
      'INVALID_INSTRUCTION_TRUST',
    );
    const {
      instructions,
      caseInformation,
      domainKnowledge,
      rulesAndConstraints,
      trace,
    } = envelope.payload;
    const bodyCanonical = stableSerialize({
      model: config.target.modelId,
      instructions: stableSerialize(instructions),
      input: [
        {
          role: 'user',
          content: [
            {
              type: 'input_text',
              text: stableSerialize({
                caseInformation,
                domainKnowledge,
                rulesAndConstraints,
                trace,
              }),
            },
          ],
        },
      ],
      text: {
        format: {
          type: 'json_schema',
          name: 'rt_program',
          strict: true,
          schema: OPENAI_RT_WIRE_SCHEMA,
        },
      },
      max_output_tokens: config.target.maxOutputTokens,
      ...(config.target.temperature === null
        ? {}
        : { temperature: config.target.temperature }),
      store: false,
      stream: false,
      background: false,
      truncation: 'disabled',
      tools: [],
    });
    invariant(
      Buffer.byteLength(bodyCanonical) <= config.execution.maxRequestBytes,
      'REQUEST_TOO_LARGE',
    );
    const result: PreparedModelRequest = freeze({
      schemaVersion: 'prepared-model-request/0.1',
      gatewayVersion: OPENAI_RESPONSES_GATEWAY_VERSION,
      wireSchemaVersion: OPENAI_RT_WIRE_VERSION,
      bodyCanonical,
      requestHash: contentHash(JSON.parse(bodyCanonical) as unknown),
      envelopeHash: contentHash(envelope),
      modelId: profile.modelId,
      maxOutputTokens: config.target.maxOutputTokens,
      maxInputTokens: config.execution.maxInputTokens,
      maxRequestBytes: config.execution.maxRequestBytes,
      maxResponseBytes: config.execution.maxResponseBytes,
      timeoutMs: config.execution.timeoutMs,
      profileHash: modelProfileHash(profile),
      profileKind: profile.kind,
    });
    this.prepared.set(result, profile);
    return result;
  }
  async invoke(
    prepared: PreparedModelRequest,
    signal?: AbortSignal,
  ): Promise<ModelObservation> {
    const profile = this.prepared.get(prepared);
    if (!profile) return observation('NOT_SENT', 'INVALID_PREPARED_REQUEST');
    if (this.used.has(prepared))
      return observation('NOT_SENT', 'ALREADY_INVOKED');
    if (signal?.aborted) return observation('NOT_SENT', 'CANCELLED');
    try {
      validateModelProfile(profile, this.now());
    } catch {
      return observation('NOT_SENT', 'PROFILE_EXPIRED');
    }
    if (this.transport.live && profile.kind !== 'VERIFIED')
      return observation('NOT_SENT', 'SYNTHETIC_PROFILE');
    let secret: string | undefined;
    try {
      if (!this.enabled()) return observation('NOT_SENT', 'DISABLED');
      secret = this.credential();
    } catch {
      return observation('NOT_SENT', 'MISSING_CREDENTIAL');
    }
    if (!secret || !/^[\x21-\x7e]{8,4096}$/.test(secret))
      return observation('NOT_SENT', 'MISSING_CREDENTIAL');
    // Claim before awaiting transport: concurrent callers cannot send the same preparation twice.
    this.used.add(prepared);
    try {
      const result = await this.transport.send({
        body: prepared.bodyCanonical,
        credential: secret,
        maxResponseBytes: prepared.maxResponseBytes,
        timeoutMs: prepared.timeoutMs,
        signal,
        beforeDispatch: () => {
          try {
            return (
              this.enabled() && this.credential() === secret && !signal?.aborted
            );
          } catch {
            return false;
          }
        },
      });
      if (result.kind !== 'RESPONSE')
        return observation(result.kind, result.reason);
      const fields = {
        httpStatus: result.status,
        requestId: safeId(result.requestId),
      };
      let parsed: ModelObservation;
      if (
        !Number.isInteger(result.status) ||
        result.status < 100 ||
        result.status > 599
      )
        parsed = observation('UNCERTAIN', 'MALFORMED_RESPONSE', fields);
      else if (result.status >= 500)
        parsed = observation('UNCERTAIN', 'SERVER_ERROR', fields);
      else if (result.status < 200 || result.status >= 300)
        parsed = observation(
          'HTTP_REJECTED',
          result.status === 401 || result.status === 403
            ? 'AUTHENTICATION'
            : result.status === 429
              ? 'RATE_LIMIT'
              : 'HTTP_ERROR',
          fields,
        );
      else if (Buffer.byteLength(result.body) > prepared.maxResponseBytes)
        parsed = observation('UNCERTAIN', 'RESPONSE_TOO_LARGE', fields);
      else parsed = this.parse(result.body, prepared.modelId, fields);
      // Inspect only copied public evidence; provider errors and private reasoning are never copied.
      if (
        Object.values(parsed).some(
          (value) => typeof value === 'string' && value.includes(secret),
        )
      )
        return observation('INVALID_RESPONSE', 'SECRET_ECHO', {
          httpStatus: result.status,
        });
      return parsed;
    } catch {
      return observation('UNCERTAIN', 'NETWORK_ERROR');
    }
  }
  private parse(
    body: string,
    modelId: string,
    transportFields: Partial<ModelObservation>,
  ): ModelObservation {
    let response: Record<string, unknown> | null;
    try {
      response = record(JSON.parse(body) as unknown);
    } catch {
      return observation(
        'INVALID_RESPONSE',
        'MALFORMED_RESPONSE',
        transportFields,
      );
    }
    if (!response || !safeId(response.id) || response.model !== modelId)
      return observation(
        'INVALID_RESPONSE',
        'MALFORMED_RESPONSE',
        transportFields,
      );
    const fields = {
      ...transportFields,
      responseId: safeId(response.id),
      modelId,
      usage: usageOf(response.usage),
    };
    if (response.status === 'failed')
      return observation('PROVIDER_FAILED', 'PROVIDER_FAILURE', fields);
    if (response.status !== 'completed' && response.status !== 'incomplete')
      return observation('UNCERTAIN', 'MALFORMED_RESPONSE', fields);
    if (!Array.isArray(response.output))
      return observation('INVALID_RESPONSE', 'MALFORMED_RESPONSE', fields);
    const texts: string[] = [];
    const refusals: string[] = [];
    for (const entry of response.output as unknown[]) {
      const item = record(entry);
      if (!item)
        return observation('INVALID_RESPONSE', 'MALFORMED_RESPONSE', fields);
      if (item.type === 'reasoning') continue;
      if (
        item.type !== 'message' ||
        item.role !== 'assistant' ||
        !Array.isArray(item.content) ||
        (response.status === 'completed' && item.status !== 'completed')
      )
        return observation('INVALID_RESPONSE', 'MALFORMED_RESPONSE', fields);
      for (const partValue of item.content as unknown[]) {
        const part = record(partValue);
        if (part?.type === 'output_text' && typeof part.text === 'string')
          texts.push(part.text);
        else if (part?.type === 'refusal' && typeof part.refusal === 'string')
          refusals.push(part.refusal);
        else
          return observation('INVALID_RESPONSE', 'MALFORMED_RESPONSE', fields);
      }
    }
    const evidence = {
      ...fields,
      publicText: texts.length ? texts.join('') : null,
      refusal: refusals.length ? refusals.join('\n') : null,
    };
    if (response.status === 'incomplete') {
      const reason = record(response.incomplete_details)?.reason;
      return observation(
        'INCOMPLETE',
        reason === 'max_output_tokens'
          ? 'MAX_OUTPUT_TOKENS'
          : reason === 'content_filter'
            ? 'CONTENT_FILTER'
            : null,
        evidence,
      );
    }
    if (refusals.length) return observation('REFUSAL', null, evidence);
    return texts.length && texts.join('').length
      ? observation('COMPLETE', null, evidence)
      : observation('INVALID_RESPONSE', 'MALFORMED_RESPONSE', evidence);
  }
}
