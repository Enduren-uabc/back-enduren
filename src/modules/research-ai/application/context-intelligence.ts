// Created by: Codex (AI-assisted), 2026-10-18
import { createHash } from 'node:crypto';
import {
  arrayOf,
  DeepReadonly,
  enumeration,
  freeze,
  invariant,
  numberContract,
  objectOf,
  oneOf,
  refKey,
  stableSerialize,
  textContract,
  unique,
  ValueOf,
  versionRef,
} from '../domain/contract';
import {
  caseField,
  ResearchCaseSnapshot,
  validateCaseSnapshot,
} from '../domain/extended-case-state';
import {
  createKnowledgeRelease,
  KnowledgeElement,
  KnowledgeRelease,
  knowledgeElementContract,
  knowledgeSourceContract,
} from '../domain/knowledge-release';

export const caseFieldName = enumeration(
  'goal',
  'experienceLevel',
  'daysAvailablePerWeek',
  'availableEquipment',
  'ageYears',
  'availableWeekdays',
  'sessionTimeLimitSeconds',
  'healthConstraints',
  'loadHistory',
  'technique',
);
const contextCaseField = caseField(
  oneOf(textContract(), numberContract(0), arrayOf(textContract())),
);
export const selectionPolicyContract = objectOf({
  ref: versionRef,
  admittedCaseFields: arrayOf(caseFieldName, 1),
  requiredCaseFields: arrayOf(caseFieldName),
  requireKnownFields: arrayOf(caseFieldName),
  allowSynthetic: enumeration(true, false),
  conflictHandling: enumeration('REPORT', 'REJECT'),
  limits: objectOf({
    maxContentBytes: numberContract(1, true),
    maxKnowledgeElements: numberContract(0, true),
  }),
});
export type SelectionPolicy = DeepReadonly<
  ValueOf<typeof selectionPolicyContract>
>;
const conflictContract = objectOf({
  code: enumeration(
    'CASE_AVAILABILITY_CONFLICT',
    'DECLARED_KNOWLEDGE_CONFLICT',
  ),
  references: arrayOf(textContract(), 2),
});
const contentContract = objectOf({
  compilerVersion: enumeration('context-compiler/0.1'),
  caseRef: objectOf({
    caseId: textContract(),
    snapshotId: textContract(),
    schemaVersion: textContract(),
    snapshotHash: textContract(),
  }),
  knowledgeReleaseRef: versionRef,
  knowledgeReleaseHash: textContract(),
  policy: selectionPolicyContract,
  caseFields: arrayOf(
    objectOf({ path: caseFieldName, field: contextCaseField }),
  ),
  excludedCaseFields: arrayOf(
    objectOf({
      path: caseFieldName,
      reason: enumeration('NOT_ADMITTED_BY_POLICY'),
    }),
  ),
  selectedKnowledge: arrayOf(knowledgeElementContract),
  sources: arrayOf(knowledgeSourceContract),
  excludedKnowledge: arrayOf(
    objectOf({
      ref: versionRef,
      reason: enumeration(
        'RETIRED',
        'NOT_REVIEWED',
        'SYNTHETIC_NOT_ALLOWED',
        'NOT_APPLICABLE',
        'APPLICABILITY_UNKNOWN',
      ),
    }),
  ),
  conflicts: arrayOf(conflictContract),
});
const packetContract = objectOf({
  schemaVersion: enumeration('context-packet/0.1'),
  packetId: textContract(),
  contentHash: textContract(),
  contentBytes: numberContract(1, true),
  content: contentContract,
});
export type ContextPacket = DeepReadonly<ValueOf<typeof packetContract>>;
type Conflict = ValueOf<typeof conflictContract>;
type ExclusionReason = ValueOf<
  typeof contentContract
>['excludedKnowledge'][number]['reason'];
type Fields = Record<string, ValueOf<typeof contextCaseField>>;

export class ContextBuildError extends Error {
  constructor(
    readonly code:
      | 'CONTEXT_LIMIT_EXCEEDED'
      | 'CONTEXT_CONFLICT'
      | 'CASE_NOT_READY',
    message: string,
  ) {
    super(message);
    this.name = 'ContextBuildError';
  }
}

export function contentHash(value: unknown): string {
  return createHash('sha256')
    .update(stableSerialize(value), 'utf8')
    .digest('hex');
}

export function createSelectionPolicy(input: unknown): SelectionPolicy {
  const policy = selectionPolicyContract.parse(input);
  unique(policy.admittedCaseFields, 'Admitted case fields');
  unique(policy.requiredCaseFields, 'Required case fields');
  unique(policy.requireKnownFields, 'Required known fields');
  for (const path of [
    ...policy.requiredCaseFields,
    ...policy.requireKnownFields,
  ]) {
    invariant(
      policy.admittedCaseFields.includes(path),
      'Required field must be admitted',
    );
  }
  // Policy lists are sets. Normalize their order, never the order of a prescription.
  policy.admittedCaseFields.sort();
  policy.requiredCaseFields.sort();
  policy.requireKnownFields.sort();
  return freeze(policy);
}

function exclusionReason(
  element: KnowledgeElement,
  fields: Fields,
  policy: SelectionPolicy,
): ExclusionReason | undefined {
  if (element.curation === 'RETIRED') return 'RETIRED';
  if (element.evidenceStatus === 'SYNTHETIC_FIXTURE' && !policy.allowSynthetic)
    return 'SYNTHETIC_NOT_ALLOWED';
  if (
    element.curation !== 'REVIEWED' &&
    element.evidenceStatus !== 'SYNTHETIC_FIXTURE'
  )
    return 'NOT_REVIEWED';
  const requirements: [string, readonly string[], boolean][] = [
    ['goal', element.applicability.goals, false],
    ['experienceLevel', element.applicability.experienceLevels, false],
    [
      'availableEquipment',
      [
        ...new Set([
          ...element.applicability.requiredEquipment,
          ...(element.kind === 'CATALOG_EXERCISE' ? element.equipment : []),
        ]),
      ],
      true,
    ],
  ];
  let unknown = false;
  for (const [path, expected, allRequired] of requirements) {
    if (expected.length === 0) continue;
    const field = fields[path];
    if (field?.state !== 'KNOWN') {
      unknown = true;
      continue;
    }
    const actual = Array.isArray(field.value)
      ? field.value
      : [String(field.value)];
    const matches = allRequired
      ? expected.every((value) => actual.includes(value))
      : expected.some((value) => actual.includes(value));
    if (!matches) return 'NOT_APPLICABLE';
  }
  return unknown ? 'APPLICABILITY_UNKNOWN' : undefined;
}

function findConflicts(
  fields: Fields,
  knowledge: readonly KnowledgeElement[],
): Conflict[] {
  const conflicts: Conflict[] = [];
  const days = fields.daysAvailablePerWeek;
  const weekdays = fields.availableWeekdays;
  if (
    days?.state === 'KNOWN' &&
    weekdays?.state === 'KNOWN' &&
    Array.isArray(weekdays.value) &&
    days.value !== weekdays.value.length
  ) {
    conflicts.push({
      code: 'CASE_AVAILABILITY_CONFLICT',
      references: ['daysAvailablePerWeek', 'availableWeekdays'],
    });
  }
  const selected = new Set(knowledge.map((element) => refKey(element.ref)));
  const pairs = new Set<string>();
  for (const element of knowledge) {
    for (const conflict of element.conflictsWith) {
      if (!selected.has(refKey(conflict))) continue;
      const references = [refKey(element.ref), refKey(conflict)].sort();
      const key = stableSerialize(references);
      if (pairs.has(key)) continue;
      pairs.add(key);
      conflicts.push({ code: 'DECLARED_KNOWLEDGE_CONFLICT', references });
    }
  }
  return conflicts.sort((a, b) =>
    compare(stableSerialize(a), stableSerialize(b)),
  );
}

function compare(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}

export function buildContextPacket(
  snapshotInput: ResearchCaseSnapshot,
  knowledgeInput: KnowledgeRelease,
  policyInput: SelectionPolicy,
): ContextPacket {
  const snapshot = validateCaseSnapshot(snapshotInput);
  const knowledge = createKnowledgeRelease(knowledgeInput);
  const policy = createSelectionPolicy(policyInput);
  const availableFields = {
    ...snapshot.fields,
    ...('details' in snapshot ? snapshot.details : {}),
  };
  const fields: Fields = Object.fromEntries(
    Object.entries(availableFields).map(([path, field]) => [
      path,
      contextCaseField.parse(field),
    ]),
  );
  for (const path of policy.requiredCaseFields) {
    if (!Object.hasOwn(fields, path))
      throw new ContextBuildError(
        'CASE_NOT_READY',
        `Required field is absent: ${path}`,
      );
  }
  for (const path of policy.requireKnownFields) {
    if (fields[path]?.state !== 'KNOWN')
      throw new ContextBuildError(
        'CASE_NOT_READY',
        `Known value required: ${path}`,
      );
  }
  const admitted = Object.fromEntries(
    Object.entries(fields).filter(([path]) =>
      policy.admittedCaseFields.some((candidate) => candidate === path),
    ),
  );
  const selectedKnowledge: KnowledgeElement[] = [];
  const excludedKnowledge: ValueOf<
    typeof contentContract
  >['excludedKnowledge'] = [];
  const ordered = [...knowledge.elements].sort((a, b) =>
    compare(refKey(a.ref), refKey(b.ref)),
  );
  for (const element of ordered) {
    // Applicability only uses admitted facts, so no hidden case field controls selection.
    const reason = exclusionReason(element, admitted, policy);
    if (reason) excludedKnowledge.push({ ref: element.ref, reason });
    else selectedKnowledge.push(element);
  }
  const conflicts = findConflicts(fields, selectedKnowledge);
  if (conflicts.length > 0 && policy.conflictHandling === 'REJECT') {
    throw new ContextBuildError('CONTEXT_CONFLICT', stableSerialize(conflicts));
  }
  const sourceKeys = new Set(
    selectedKnowledge.flatMap((element) => element.sourceRefs.map(refKey)),
  );
  const content = contentContract.parse({
    compilerVersion: 'context-compiler/0.1',
    caseRef: {
      caseId: snapshot.caseId,
      snapshotId: snapshot.snapshotId,
      schemaVersion: snapshot.schemaVersion,
      snapshotHash: contentHash(snapshot),
    },
    knowledgeReleaseRef: knowledge.ref,
    knowledgeReleaseHash: contentHash(knowledge),
    policy,
    caseFields: Object.keys(admitted)
      .sort()
      .map((path) => ({ path, field: admitted[path] })),
    excludedCaseFields: Object.keys(fields)
      .filter((path) => !Object.hasOwn(admitted, path))
      .sort()
      .map((path) => ({ path, reason: 'NOT_ADMITTED_BY_POLICY' })),
    selectedKnowledge,
    sources: knowledge.sources
      .filter((source) => sourceKeys.has(refKey(source.ref)))
      .sort((a, b) => compare(refKey(a.ref), refKey(b.ref))),
    excludedKnowledge,
    conflicts,
  });
  const contentBytes = Buffer.byteLength(stableSerialize(content), 'utf8');
  if (
    contentBytes > policy.limits.maxContentBytes ||
    selectedKnowledge.length > policy.limits.maxKnowledgeElements
  ) {
    throw new ContextBuildError(
      'CONTEXT_LIMIT_EXCEEDED',
      `No packet emitted: ${contentBytes} content bytes; ${selectedKnowledge.length} knowledge elements; limits ${stableSerialize(policy.limits)}`,
    );
  }
  const hash = contentHash(content);
  return freeze({
    schemaVersion: 'context-packet/0.1',
    packetId: `ctx-${hash}`,
    contentHash: hash,
    contentBytes,
    content,
  });
}

/** For persisted artifacts: verify integrity and references; S1B must additionally authenticate provenance. */
export function validateContextPacket(input: unknown): ContextPacket {
  const packet = packetContract.parse(input);
  invariant(
    packet.contentHash === contentHash(packet.content) &&
      packet.packetId === `ctx-${packet.contentHash}`,
    'Context integrity mismatch',
  );
  invariant(
    packet.contentBytes ===
      Buffer.byteLength(stableSerialize(packet.content), 'utf8'),
    'Context size mismatch',
  );
  const policy = createSelectionPolicy(packet.content.policy);
  invariant(
    packet.contentBytes <= policy.limits.maxContentBytes &&
      packet.content.selectedKnowledge.length <=
        policy.limits.maxKnowledgeElements,
    'Context exceeds declared limits',
  );
  unique(
    packet.content.caseFields.map((entry) => entry.path),
    'Context case fields',
  );
  const paths = new Set(packet.content.caseFields.map((entry) => entry.path));
  invariant(
    packet.content.caseFields.every((entry) =>
      policy.admittedCaseFields.includes(entry.path),
    ),
    'Unadmitted case field',
  );
  invariant(
    policy.requiredCaseFields.every((path) => paths.has(path)),
    'Missing required case field',
  );
  invariant(
    policy.requireKnownFields.every((path) =>
      packet.content.caseFields.some(
        (entry) => entry.path === path && entry.field.state === 'KNOWN',
      ),
    ),
    'Missing required known value',
  );
  const sources = new Set(
    packet.content.sources.map((source) => refKey(source.ref)),
  );
  unique(
    packet.content.sources.map((source) => source.ref.id),
    'Context source IDs',
  );
  unique(
    [
      ...packet.content.selectedKnowledge.map((element) => element.ref.id),
      ...packet.content.excludedKnowledge.map((element) => element.ref.id),
    ],
    'Selected/excluded knowledge IDs',
  );
  const fields = Object.fromEntries(
    packet.content.caseFields.map((entry) => [entry.path, entry.field]),
  );
  invariant(
    packet.content.selectedKnowledge.every(
      (element) => exclusionReason(element, fields, policy) === undefined,
    ),
    'Knowledge violates selection policy',
  );
  invariant(
    packet.content.selectedKnowledge.every((element) =>
      element.sourceRefs.every((ref) => sources.has(refKey(ref))),
    ),
    'Unresolved context source',
  );
  const usedSources = new Set(
    packet.content.selectedKnowledge.flatMap((element) =>
      element.sourceRefs.map(refKey),
    ),
  );
  invariant(
    packet.content.sources.every((source) =>
      usedSources.has(refKey(source.ref)),
    ),
    'Unselected context source',
  );
  invariant(
    policy.conflictHandling !== 'REJECT' ||
      packet.content.conflicts.length === 0,
    'Context violates conflict policy',
  );
  return freeze(packet);
}
