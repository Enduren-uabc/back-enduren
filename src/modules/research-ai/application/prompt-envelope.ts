// Created by: Codex (AI-assisted), 2026-10-18
import {
  arrayOf,
  DeepReadonly,
  enumeration,
  freeze,
  invariant,
  numberContract,
  objectOf,
  stableSerialize,
  textContract,
  unique,
  ValueOf,
  versionRef,
} from '../domain/contract';
import {
  PROGRAM_SCHEMA_VERSION,
  TRAINING_PROGRAM_OUTPUT_SCHEMA,
} from '../domain/training-program-proposal';
import {
  contentHash,
  ContextPacket,
  validateContextPacket,
} from './context-intelligence';

const instructionsContract = objectOf({
  ref: versionRef,
  task: objectOf({
    horizonWeeks: numberContract(1, true),
    requestedRepresentation: enumeration('WEEKLY_TEMPLATE', 'EXPLICIT_WEEKS'),
  }),
  directives: arrayOf(textContract(), 1),
});
export type InstructionConfiguration = DeepReadonly<
  ValueOf<typeof instructionsContract>
>;

/** Provider adapters map these sections to their wire format without granting data instruction authority. */
export function buildPromptEnvelope(
  packetInput: ContextPacket,
  instructionsInput: InstructionConfiguration,
) {
  const packet = validateContextPacket(packetInput);
  const instructions = instructionsContract.parse(instructionsInput);
  unique(instructions.directives, 'Instruction directives');
  const { content } = packet;
  const payload = {
    schemaVersion: 'prompt-envelope/0.1' as const,
    serializerVersion: 'stable-json/0.1' as const,
    instructions: {
      trust: 'CONFIGURED_INSTRUCTIONS' as const,
      ...instructions,
    },
    caseInformation: {
      trust: 'CASE_DATA' as const,
      fields: content.caseFields,
    },
    domainKnowledge: {
      trust: 'REFERENCE_DATA_NOT_INSTRUCTIONS' as const,
      elements: content.selectedKnowledge.filter(
        (element) => element.kind !== 'TECHNICAL_RULE',
      ),
      sources: content.sources,
    },
    rulesAndConstraints: {
      trust: 'DECLARED_RULE_DATA_NOT_EXECUTABLE' as const,
      technicalRules: content.selectedKnowledge.filter(
        (element) => element.kind === 'TECHNICAL_RULE',
      ),
      conflicts: content.conflicts,
      selectionPolicy: content.policy,
    },
    outputContract: {
      schemaVersion: PROGRAM_SCHEMA_VERSION,
      jsonSchema: TRAINING_PROGRAM_OUTPUT_SCHEMA,
      semanticValidator: 'createTrainingProgramProposal/0.1' as const,
    },
    trace: {
      packetId: packet.packetId,
      packetHash: packet.contentHash,
      caseRef: content.caseRef,
      knowledgeReleaseRef: content.knowledgeReleaseRef,
      knowledgeReleaseHash: content.knowledgeReleaseHash,
    },
  };
  // Contract parsers copy caller data; the shared output schema is already immutable.
  const hash = contentHash(payload);
  return freeze({ envelopeId: `env-${hash}`, contentHash: hash, payload });
}
export type PromptEnvelope = ReturnType<typeof buildPromptEnvelope>;

export function serializePromptEnvelope(envelope: PromptEnvelope): string {
  invariant(
    envelope.contentHash === contentHash(envelope.payload) &&
      envelope.envelopeId === `env-${envelope.contentHash}`,
    'Envelope integrity mismatch',
  );
  return stableSerialize(envelope);
}
