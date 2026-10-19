/**
 * Research-only canonical case state. No operational Endure entity, ORM, or LLM
 * provider is imported here. This is an explicitly provisional v0 contract.
 */
export const CASE_STATE_SCHEMA_VERSION = 'research-case-v0' as const;

export type MissingState =
  | 'UNKNOWN'
  | 'NOT_COLLECTED'
  | 'NOT_APPLICABLE'
  | 'WITHHELD'
  | 'INVALID';

export type FieldSourceType =
  | 'SELF_REPORTED'
  | 'PROFESSIONAL_REPORTED'
  | 'OBSERVED_OPERATIONAL'
  | 'IMPORTED'
  | 'COMPUTED'
  | 'SYSTEM_DEFAULT';

export interface FieldProvenance {
  sourceType: FieldSourceType;
  sourceRef: string;
  observedAt: string;
}

export type CaseField<T> =
  | { state: 'KNOWN'; value: T; provenance: FieldProvenance }
  | { state: MissingState; provenance?: FieldProvenance };

export interface CaseStateFields {
  goal: CaseField<string>;
  experienceLevel: CaseField<string>;
  daysAvailablePerWeek: CaseField<number>;
  availableEquipment: CaseField<string[]>;
}

export interface CaseStateInput {
  caseId: string;
  snapshotId: string;
  capturedAt: string;
  fields: CaseStateFields;
}

export interface CaseStateSnapshot extends CaseStateInput {
  schemaVersion: typeof CASE_STATE_SCHEMA_VERSION;
}

function requireNonempty(value: string, label: string): string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(`${label} is required`);
  }
  return value.trim();
}

function requireDate(value: string, label: string): void {
  if (typeof value !== 'string' || !Number.isFinite(Date.parse(value))) {
    throw new Error(`${label} must be a valid timestamp`);
  }
}

function copyProvenance(p: FieldProvenance): FieldProvenance {
  if (!p || typeof p !== 'object') {
    throw new Error('KNOWN case fields require provenance');
  }
  const sourceTypes: readonly string[] = [
    'SELF_REPORTED',
    'PROFESSIONAL_REPORTED',
    'OBSERVED_OPERATIONAL',
    'IMPORTED',
    'COMPUTED',
    'SYSTEM_DEFAULT',
  ];
  if (!sourceTypes.includes(p.sourceType)) {
    throw new Error('Unrecognized provenance source type');
  }
  requireDate(p.observedAt, 'provenance.observedAt');
  return {
    sourceType: p.sourceType,
    sourceRef: requireNonempty(p.sourceRef, 'provenance.sourceRef'),
    observedAt: p.observedAt,
  };
}

function copyField<T>(
  field: CaseField<T>,
  name: string,
  validate: (value: T) => T,
): CaseField<T> {
  if (!field || typeof field !== 'object') {
    throw new Error(`${name} must be an explicit case field`);
  }
  if (field.state === 'KNOWN') {
    return {
      state: 'KNOWN',
      value: validate(field.value),
      provenance: copyProvenance(field.provenance),
    };
  }
  const allowedMissing: readonly string[] = [
    'UNKNOWN',
    'NOT_COLLECTED',
    'NOT_APPLICABLE',
    'WITHHELD',
    'INVALID',
  ];
  if (!allowedMissing.includes(field.state)) {
    throw new Error(`${name} has unsupported missingness state`);
  }
  if ('value' in field) {
    throw new Error(`${name}: missingness must not carry a fabricated value`);
  }
  return field.provenance
    ? { state: field.state, provenance: copyProvenance(field.provenance) }
    : { state: field.state };
}

function asText(value: string): string {
  return requireNonempty(value, 'case text value');
}

function asDays(value: number): number {
  if (!Number.isInteger(value) || value < 1 || value > 7) {
    throw new Error('daysAvailablePerWeek must be an integer from 1 to 7');
  }
  return value;
}

function asEquipment(value: string[]): string[] {
  if (!Array.isArray(value) || value.some((item) => typeof item !== 'string')) {
    throw new Error('availableEquipment must be a list of strings');
  }
  return value.map((item) => requireNonempty(item, 'equipment entry'));
}

function deepFreeze<T>(value: T): T {
  if (value !== null && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.values(value).forEach((child: unknown) => deepFreeze(child));
    Object.freeze(value);
  }
  return value;
}

/**
 * Copies ONLY allowed field families: no name, email, ID document, or implicit
 * profile defaults are accepted into the research snapshot.
 */
export function createCaseStateSnapshot(
  input: CaseStateInput,
): CaseStateSnapshot {
  if (!input?.fields) {
    throw new Error('Case state fields are required');
  }
  requireDate(input.capturedAt, 'capturedAt');
  return deepFreeze({
    schemaVersion: CASE_STATE_SCHEMA_VERSION,
    caseId: requireNonempty(input.caseId, 'caseId'),
    snapshotId: requireNonempty(input.snapshotId, 'snapshotId'),
    capturedAt: input.capturedAt,
    fields: {
      goal: copyField(input.fields.goal, 'goal', asText),
      experienceLevel: copyField(
        input.fields.experienceLevel,
        'experienceLevel',
        asText,
      ),
      daysAvailablePerWeek: copyField(
        input.fields.daysAvailablePerWeek,
        'daysAvailablePerWeek',
        asDays,
      ),
      availableEquipment: copyField(
        input.fields.availableEquipment,
        'availableEquipment',
        asEquipment,
      ),
    },
  });
}

/** Stable, content-addressing-ready serialization; hashing belongs to evidence adapter. */
export function serializeCaseStateSnapshot(
  snapshot: CaseStateSnapshot,
): string {
  const serialize = (item: unknown): string => {
    if (Array.isArray(item)) {
      return `[${item.map(serialize).join(',')}]`;
    }
    if (item !== null && typeof item === 'object') {
      const object = item as Record<string, unknown>;
      return `{${Object.keys(object)
        .sort()
        .map((key) => `${JSON.stringify(key)}:${serialize(object[key])}`)
        .join(',')}}`;
    }
    const json = JSON.stringify(item);
    if (json === undefined) {
      throw new Error('Non-JSON value cannot be serialized');
    }
    return json;
  };
  return serialize(snapshot);
}
