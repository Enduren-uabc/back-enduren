// Created by: Codex (AI-assisted), 2026-10-18
import {
  arrayOf,
  DeepReadonly,
  enumeration,
  freeze,
  identifier,
  invariant,
  objectOf,
  oneOf,
  refKey,
  textContract,
  unique,
  ValueOf,
  versionRef,
} from './contract';

export const knowledgeSourceContract = objectOf({
  ref: versionRef,
  title: textContract(),
  locator: textContract(),
  kind: enumeration('DOCUMENT', 'SYNTHETIC_FIXTURE'),
});
const applicabilityContract = objectOf({
  goals: arrayOf(textContract()),
  experienceLevels: arrayOf(textContract()),
  requiredEquipment: arrayOf(textContract()),
});
const common = {
  ref: versionRef,
  sourceRefs: arrayOf(versionRef, 1),
  curation: enumeration('DRAFT', 'REVIEWED', 'RETIRED'),
  evidenceStatus: enumeration('SYNTHETIC_FIXTURE', 'SOURCE_BACKED'),
  applicability: applicabilityContract,
  conflictsWith: arrayOf(versionRef),
};
export const knowledgeElementContract = oneOf(
  objectOf({
    ...common,
    kind: enumeration('CATALOG_EXERCISE'),
    name: textContract(),
    equipment: arrayOf(textContract()),
  }),
  objectOf({
    ...common,
    kind: enumeration('CLAIM'),
    statement: textContract(),
  }),
  objectOf({
    ...common,
    kind: enumeration('TECHNICAL_RULE'),
    code: identifier,
    statement: textContract(),
  }),
  objectOf({
    ...common,
    kind: enumeration('PROFESSIONAL_GUIDANCE'),
    statement: textContract(),
  }),
);
export const knowledgeReleaseContract = objectOf({
  schemaVersion: enumeration('knowledge-release/0.1'),
  ref: versionRef,
  curationPolicyVersion: textContract(),
  scope: textContract(),
  sources: arrayOf(knowledgeSourceContract),
  elements: arrayOf(knowledgeElementContract),
});
export type KnowledgeElement = DeepReadonly<
  ValueOf<typeof knowledgeElementContract>
>;
export type KnowledgeRelease = DeepReadonly<
  ValueOf<typeof knowledgeReleaseContract>
>;

export function createKnowledgeRelease(input: unknown): KnowledgeRelease {
  const release = knowledgeReleaseContract.parse(input);
  unique(
    release.sources.map((source) => source.ref.id),
    'Source IDs within release',
  );
  unique(
    release.elements.map((element) => element.ref.id),
    'Element IDs within release',
  );
  const sources = new Map(
    release.sources.map((source) => [refKey(source.ref), source]),
  );
  const elements = new Set(
    release.elements.map((element) => refKey(element.ref)),
  );
  for (const element of release.elements) {
    unique(element.sourceRefs.map(refKey), 'Source references');
    unique(element.conflictsWith.map(refKey), 'Conflict references');
    for (const ref of element.sourceRefs) {
      const source = sources.get(refKey(ref));
      invariant(source, `Unresolved source: ${ref.id}@${ref.version}`);
      invariant(
        element.evidenceStatus !== 'SOURCE_BACKED' ||
          source.kind !== 'SYNTHETIC_FIXTURE',
        'Synthetic source cannot back a scientific claim',
      );
    }
    for (const ref of element.conflictsWith) {
      invariant(
        elements.has(refKey(ref)),
        `Unresolved conflict: ${ref.id}@${ref.version}`,
      );
      invariant(
        refKey(ref) !== refKey(element.ref),
        'Element cannot conflict with itself',
      );
    }
    for (const values of Object.values(element.applicability))
      unique(values, 'Applicability values');
    if (element.kind === 'CATALOG_EXERCISE')
      unique(element.equipment, 'Catalog equipment');
  }
  return freeze(release);
}
