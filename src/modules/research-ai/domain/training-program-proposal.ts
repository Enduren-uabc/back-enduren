// Created by: Codex (AI-assisted), 2026-10-18
import {
  arrayOf,
  DeepReadonly,
  enumeration,
  freeze,
  identifier,
  invariant,
  numberContract,
  objectOf,
  oneOf,
  refKey,
  specified,
  textContract,
  unique,
  ValueOf,
  versionRef,
} from './contract';
import {
  ResearchCaseSnapshot,
  validateCaseSnapshot,
  weekday,
} from './extended-case-state';
import { createKnowledgeRelease, KnowledgeRelease } from './knowledge-release';

export const PROGRAM_SCHEMA_VERSION = 'training-program/0.1' as const;
export const EXPANSION_VERSION = 'weekly-template-expander/0.1' as const;
const seconds = objectOf({
  value: numberContract(0),
  unit: enumeration('seconds'),
});
const repetitions = oneOf(
  objectOf({ kind: enumeration('COUNT'), count: numberContract(1, true) }),
  objectOf({
    kind: enumeration('RANGE'),
    min: numberContract(1, true),
    max: numberContract(1, true),
  }),
);
const intensity = oneOf(
  objectOf({
    method: enumeration('RIR'),
    value: numberContract(0),
    unit: enumeration('repetitions_in_reserve'),
  }),
  objectOf({
    method: enumeration('RPE'),
    value: numberContract(0),
    unit: enumeration('score'),
    scale: enumeration('RPE_0_10', 'RPE_6_20'),
  }),
  objectOf({
    method: enumeration('ABSOLUTE_LOAD'),
    value: numberContract(0),
    unit: enumeration('kg'),
  }),
  objectOf({
    method: enumeration('PERCENT_1RM'),
    value: numberContract(0),
    unit: enumeration('percent_1rm'),
  }),
);
export const setPrescriptionContract = objectOf({
  setId: identifier,
  order: numberContract(1, true),
  repetitions: specified(repetitions),
  intensity: specified(intensity),
  restBetweenSets: specified(seconds),
});
const exerciseContract = objectOf({
  exerciseId: identifier,
  order: numberContract(1, true),
  name: textContract(),
  catalogRef: oneOf(versionRef, enumeration(null)),
  sets: specified(arrayOf(setPrescriptionContract, 1)),
  restBetweenExercises: specified(seconds),
});
const sessionContract = objectOf({
  sessionId: identifier,
  order: numberContract(1, true),
  weekday: specified(weekday),
  exercises: arrayOf(exerciseContract),
});
export const plannedWeekContract = objectOf({
  weekId: identifier,
  weekNumber: numberContract(1, true),
  sessions: arrayOf(sessionContract),
});
const temporalRuleContract = objectOf({
  ruleId: identifier,
  weekNumbers: arrayOf(numberContract(1, true), 1),
  exerciseTemplateIds: arrayOf(identifier, 1),
  replacementSets: specified(arrayOf(setPrescriptionContract, 1)),
});
export const trainingProgramContract = objectOf({
  schemaVersion: enumeration(PROGRAM_SCHEMA_VERSION),
  proposalId: identifier,
  caseRef: objectOf({ caseId: textContract(), snapshotId: textContract() }),
  knowledgeReleaseRef: versionRef,
  horizon: objectOf({ weeks: numberContract(1, true) }),
  schedule: oneOf(
    objectOf({
      format: enumeration('WEEKLY_TEMPLATE'),
      templateId: identifier,
      continuation: enumeration('REPEAT_TEMPLATE_THEN_APPLY_RULES'),
      sessions: arrayOf(sessionContract),
      temporalRules: arrayOf(temporalRuleContract),
    }),
    objectOf({
      format: enumeration('EXPLICIT_WEEKS'),
      weeks: arrayOf(plannedWeekContract, 1),
    }),
  ),
  omissions: arrayOf(
    objectOf({
      component: identifier,
      state: enumeration('UNSPECIFIED', 'NOT_APPLICABLE'),
      reason: textContract(),
    }),
  ),
});
export const TRAINING_PROGRAM_OUTPUT_SCHEMA = freeze({
  $schema: 'https://json-schema.org/draft/2020-12/schema',
  $id: 'urn:rg-das:training-program:0.1',
  ...(trainingProgramContract.schema as Record<string, unknown>),
});
export type TrainingProgramProposal = DeepReadonly<
  ValueOf<typeof trainingProgramContract>
>;
export type PlannedWeek = DeepReadonly<ValueOf<typeof plannedWeekContract>>;
export type SetPrescription = ValueOf<typeof setPrescriptionContract>;
type Sessions = readonly DeepReadonly<ValueOf<typeof sessionContract>>[];

function validateSets(
  sets: DeepReadonly<ValueOf<typeof exerciseContract>>['sets'],
): void {
  if (sets.state !== 'SPECIFIED') return;
  unique(
    sets.value.map((set) => set.setId),
    'Set IDs',
  );
  unique(
    sets.value.map((set) => String(set.order)),
    'Set order',
  );
  for (const set of sets.value) {
    if (
      set.repetitions.state === 'SPECIFIED' &&
      set.repetitions.value.kind === 'RANGE'
    ) {
      invariant(
        set.repetitions.value.min <= set.repetitions.value.max,
        'Repetition range reversed',
      );
    }
    if (
      set.intensity.state === 'SPECIFIED' &&
      set.intensity.value.method === 'RPE'
    ) {
      const { scale, value } = set.intensity.value;
      invariant(
        scale === 'RPE_0_10' ? value <= 10 : value >= 6 && value <= 20,
        'RPE outside declared scale',
      );
    }
  }
}

function validateSessions(sessions: Sessions, catalog: Set<string>): void {
  unique(
    sessions.map((session) => session.sessionId),
    'Session IDs',
  );
  unique(
    sessions.map((session) => String(session.order)),
    'Session order',
  );
  // Unique across a template/week makes rule targeting unambiguous even for repeated catalog exercises.
  unique(
    sessions.flatMap((session) =>
      session.exercises.map((exercise) => exercise.exerciseId),
    ),
    'Exercise occurrence IDs',
  );
  for (const session of sessions) {
    unique(
      session.exercises.map((exercise) => String(exercise.order)),
      'Exercise order',
    );
    for (const exercise of session.exercises) {
      invariant(
        exercise.catalogRef === null ||
          catalog.has(refKey(exercise.catalogRef)),
        'Unresolved catalog reference',
      );
      validateSets(exercise.sets);
    }
  }
}

/** Structural validity does not establish prescription completeness or professional acceptability. */
export function createTrainingProgramProposal(
  input: unknown,
  knowledgeInput: KnowledgeRelease,
  snapshotInput: ResearchCaseSnapshot,
): TrainingProgramProposal {
  const knowledge = createKnowledgeRelease(knowledgeInput);
  const snapshot = validateCaseSnapshot(snapshotInput);
  const proposal = trainingProgramContract.parse(input);
  invariant(
    proposal.caseRef.caseId === snapshot.caseId &&
      proposal.caseRef.snapshotId === snapshot.snapshotId,
    'Proposal/snapshot reference mismatch',
  );
  invariant(
    refKey(proposal.knowledgeReleaseRef) === refKey(knowledge.ref),
    'Proposal/knowledge release mismatch',
  );
  const catalog = new Set(
    knowledge.elements
      .filter((element) => element.kind === 'CATALOG_EXERCISE')
      .map((element) => refKey(element.ref)),
  );
  unique(
    proposal.omissions.map((omission) => omission.component),
    'Omission components',
  );
  if (proposal.schedule.format === 'EXPLICIT_WEEKS') {
    const weeks = proposal.schedule.weeks;
    unique(
      weeks.map((week) => week.weekId),
      'Week IDs',
    );
    unique(
      weeks.map((week) => String(week.weekNumber)),
      'Week numbers',
    );
    invariant(
      weeks.length === proposal.horizon.weeks,
      'Explicit schedule must represent every horizon week',
    );
    for (const week of weeks) {
      invariant(
        week.weekNumber <= proposal.horizon.weeks,
        'Week outside horizon',
      );
      validateSessions(week.sessions, catalog);
    }
  } else {
    validateSessions(proposal.schedule.sessions, catalog);
    const exerciseIds = new Set(
      proposal.schedule.sessions.flatMap((session) =>
        session.exercises.map((exercise) => exercise.exerciseId),
      ),
    );
    unique(
      proposal.schedule.temporalRules.map((rule) => rule.ruleId),
      'Temporal rule IDs',
    );
    const targets = new Set<string>();
    for (const rule of proposal.schedule.temporalRules) {
      unique(rule.weekNumbers.map(String), 'Rule weeks');
      unique(rule.exerciseTemplateIds, 'Rule targets');
      validateSets(rule.replacementSets);
      for (const week of rule.weekNumbers) {
        invariant(week <= proposal.horizon.weeks, 'Rule week outside horizon');
        for (const exerciseId of rule.exerciseTemplateIds) {
          invariant(
            exerciseIds.has(exerciseId),
            'Unknown temporal rule exercise',
          );
          const target = `${week}/${exerciseId}`;
          invariant(
            !targets.has(target),
            'Overlapping temporal rules require explicit resolution',
          );
          targets.add(target);
        }
      }
    }
  }
  return freeze(proposal);
}

export interface EffectiveTrainingProgram {
  readonly sourceProposalId: string;
  readonly sourceFormat: TrainingProgramProposal['schedule']['format'];
  readonly expansionVersion: typeof EXPANSION_VERSION;
  readonly weeks: readonly PlannedWeek[];
}

/** Bound expansion separately from the contract: the study horizon has no hard-coded duration. */
export function expandTrainingProgram(
  proposal: TrainingProgramProposal,
  maxWeeks: number,
): EffectiveTrainingProgram {
  invariant(
    Number.isSafeInteger(maxWeeks) &&
      maxWeeks > 0 &&
      proposal.horizon.weeks <= maxWeeks,
    'Expansion exceeds explicit week limit',
  );
  const schedule = proposal.schedule;
  let weeks: PlannedWeek[];
  if (schedule.format === 'EXPLICIT_WEEKS') {
    weeks = schedule.weeks.map((week) => plannedWeekContract.parse(week));
  } else {
    const replacements = new Map(
      schedule.temporalRules.flatMap((rule) =>
        rule.weekNumbers.flatMap((week) =>
          rule.exerciseTemplateIds.map(
            (exerciseId) =>
              [`${week}/${exerciseId}`, rule.replacementSets] as const,
          ),
        ),
      ),
    );
    weeks = Array.from({ length: proposal.horizon.weeks }, (_, index) => {
      const weekNumber = index + 1;
      return plannedWeekContract.parse({
        weekId: `W${weekNumber}`,
        weekNumber,
        sessions: schedule.sessions.map((session) => ({
          ...session,
          exercises: session.exercises.map((exercise) => ({
            ...exercise,
            sets:
              replacements.get(`${weekNumber}/${exercise.exerciseId}`) ??
              exercise.sets,
          })),
        })),
      });
    });
  }
  return freeze({
    sourceProposalId: proposal.proposalId,
    sourceFormat: schedule.format,
    expansionVersion: EXPANSION_VERSION,
    weeks,
  });
}

/** Identity is scoped by occurrence, not by catalog ID or array position. */
export function prescriptionPath(
  weekId: string,
  sessionId: string,
  exerciseId: string,
  setId?: string,
): string {
  return [
    weekId,
    sessionId,
    exerciseId,
    ...(setId === undefined ? [] : [setId]),
  ]
    .map((id) => identifier.parse(id))
    .join('/');
}
