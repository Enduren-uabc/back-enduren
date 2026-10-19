// Created by: Codex (AI-assisted), 2026-10-18
import {
  CaseStateInput,
  CaseStateSnapshot,
  createCaseStateSnapshot,
} from './case-state';
import {
  arrayOf,
  enumeration,
  freeze,
  invariant,
  numberContract,
  objectOf,
  oneOf,
  textContract,
  ValueOf,
  Contract,
  DeepReadonly,
} from './contract';

export const EXTENDED_CASE_SCHEMA_VERSION = 'research-case-v0.1' as const;
export const weekday = enumeration(
  'MONDAY',
  'TUESDAY',
  'WEDNESDAY',
  'THURSDAY',
  'FRIDAY',
  'SATURDAY',
  'SUNDAY',
);
const provenance = objectOf({
  sourceType: enumeration(
    'SELF_REPORTED',
    'PROFESSIONAL_REPORTED',
    'OBSERVED_OPERATIONAL',
    'IMPORTED',
    'COMPUTED',
    'SYSTEM_DEFAULT',
  ),
  sourceRef: textContract(),
  observedAt: textContract(),
});
export function caseField<T>(value: Contract<T>) {
  return oneOf(
    objectOf({ state: enumeration('KNOWN'), value, provenance }),
    objectOf({
      state: enumeration(
        'UNKNOWN',
        'NOT_COLLECTED',
        'NOT_APPLICABLE',
        'WITHHELD',
        'INVALID',
      ),
    }),
    objectOf({
      state: enumeration(
        'UNKNOWN',
        'NOT_COLLECTED',
        'NOT_APPLICABLE',
        'WITHHELD',
        'INVALID',
      ),
      provenance,
    }),
  );
}
const detailsContract = objectOf({
  ageYears: caseField(numberContract(0, true)),
  availableWeekdays: caseField(arrayOf(weekday)),
  sessionTimeLimitSeconds: caseField(numberContract(0, true)),
  healthConstraints: caseField(arrayOf(textContract())),
  loadHistory: caseField(textContract()),
  technique: caseField(textContract()),
});
export type ExtendedCaseDetails = ValueOf<typeof detailsContract>;
export type ExtendedCaseStateSnapshot = DeepReadonly<
  Omit<CaseStateSnapshot, 'schemaVersion'> & {
    schemaVersion: typeof EXTENDED_CASE_SCHEMA_VERSION;
    details: ExtendedCaseDetails;
  }
>;
export type ResearchCaseSnapshot =
  | CaseStateSnapshot
  | ExtendedCaseStateSnapshot;

/** The original v0 factory/schema is unchanged. New fields require an explicit version. */
export function createExtendedCaseStateSnapshot(
  input: CaseStateInput,
  details: unknown,
): ExtendedCaseStateSnapshot {
  const core = createCaseStateSnapshot(input);
  const parsed = detailsContract.parse(details);
  for (const field of Object.values(parsed)) {
    if ('provenance' in field) {
      invariant(
        Number.isFinite(Date.parse(field.provenance.observedAt)),
        'Invalid details provenance timestamp',
      );
    }
  }
  if (parsed.availableWeekdays.state === 'KNOWN') {
    invariant(
      new Set(parsed.availableWeekdays.value).size ===
        parsed.availableWeekdays.value.length,
      'Duplicate available weekday',
    );
  }
  return freeze({
    ...core,
    schemaVersion: EXTENDED_CASE_SCHEMA_VERSION,
    details: parsed,
  });
}

export function validateCaseSnapshot(
  snapshot: ResearchCaseSnapshot,
): ResearchCaseSnapshot {
  invariant(
    snapshot !== null && typeof snapshot === 'object',
    'Case snapshot required',
  );
  invariant(
    snapshot.schemaVersion === 'research-case-v0' ||
      snapshot.schemaVersion === EXTENDED_CASE_SCHEMA_VERSION,
    'Unsupported case schema version',
  );
  // The v0 factory copies only authorized fields; never forward an arbitrary operational object.
  const input = snapshot as CaseStateInput;
  return snapshot.schemaVersion === EXTENDED_CASE_SCHEMA_VERSION
    ? createExtendedCaseStateSnapshot(input, snapshot.details)
    : createCaseStateSnapshot(input);
}
