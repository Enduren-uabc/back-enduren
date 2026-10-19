// Created by: Codex (AI-assisted), 2026-10-18
import { stableSerialize } from './contract';
import {
  createTrainingProgramProposal,
  expandTrainingProgram,
  plannedWeekContract,
  prescriptionPath,
  trainingProgramContract,
} from './training-program-proposal';
import {
  createRtF04Case,
  createRtF04Knowledge,
  createRtF04Proposal,
  rtF04ProposalInput,
} from '../fixtures/rt-f04.fixture';

const construct = (input: unknown) =>
  createTrainingProgramProposal(
    input,
    createRtF04Knowledge(),
    createRtF04Case(),
  );

describe('RT prescription contract and explicit temporal expansion', () => {
  it('reconstructs RT-F04 A: 8 sessions, 24 distinct exercise occurrences and 60 sets', () => {
    const proposal = createRtF04Proposal();
    const effective = expandTrainingProgram(proposal, 52);
    expect(effective.weeks).toHaveLength(4);
    const sessions = effective.weeks.flatMap((week) => week.sessions);
    expect(sessions).toHaveLength(8);
    const exercises = sessions.flatMap((session) => session.exercises);
    expect(exercises).toHaveLength(24);
    const paths = effective.weeks.flatMap((week) =>
      week.sessions.flatMap((session) =>
        session.exercises.flatMap((exercise) => {
          if (exercise.sets.state !== 'SPECIFIED')
            throw new Error('Expected specified fixture sets');
          return exercise.sets.value.map((set) =>
            prescriptionPath(
              week.weekId,
              session.sessionId,
              exercise.exerciseId,
              set.setId,
            ),
          );
        }),
      ),
    );
    expect(paths).toHaveLength(60);
    expect(new Set(paths).size).toBe(60);
    expect(paths).toContain('W3/SB/SB-E3/set-2');
    for (const [index, week] of effective.weeks.entries()) {
      for (const session of week.sessions) {
        expect(session.exercises.map((exercise) => exercise.name)).toEqual(
          session.sessionId === 'SA'
            ? [
                'Sentadilla goblet',
                'Press de pecho con mancuernas',
                'Remo bilateral con mancuernas',
              ]
            : [
                'Peso muerto rumano con mancuernas',
                'Press de hombros con mancuernas',
                'Remo bilateral con mancuernas',
              ],
        );
        expect(session.weekday).toEqual({
          state: 'SPECIFIED',
          value: session.sessionId === 'SA' ? 'TUESDAY' : 'FRIDAY',
        });
        for (const exercise of session.exercises) {
          expect(exercise.restBetweenExercises).toEqual({
            state: 'SPECIFIED',
            value: { value: 180, unit: 'seconds' },
          });
          if (exercise.sets.state !== 'SPECIFIED')
            throw new Error('Expected specified fixture sets');
          expect(exercise.sets.value).toHaveLength([2, 2, 3, 3][index]);
          for (const set of exercise.sets.value) {
            expect(set.repetitions).toEqual({
              state: 'SPECIFIED',
              value: { kind: 'COUNT', count: [8, 9, 9, 10][index] },
            });
            expect(set.intensity).toEqual({
              state: 'SPECIFIED',
              value: {
                method: 'RIR',
                value: 2,
                unit: 'repetitions_in_reserve',
              },
            });
            expect(set.restBetweenSets).toEqual({
              state: 'SPECIFIED',
              value: { value: 120, unit: 'seconds' },
            });
          }
        }
      }
    }
  });

  it('preserves A as source and round-trips the equivalent B without inventing a second pipeline', () => {
    const a = createRtF04Proposal();
    const effective = expandTrainingProgram(a, 52);
    const b = construct({
      ...a,
      proposalId: 'fixture-B',
      schedule: { format: 'EXPLICIT_WEEKS', weeks: effective.weeks },
    });
    expect(expandTrainingProgram(b, 52).weeks).toEqual(effective.weeks);
    expect(construct(JSON.parse(stableSerialize(b)))).toEqual(b);
    expect(a.schedule.format).toBe('WEEKLY_TEMPLATE');
  });

  it('preserves a difference at W3/SB/SB-E3 only, retaining the immutable A original', () => {
    const original = createRtF04Proposal();
    const effective = expandTrainingProgram(original, 52);
    const b = trainingProgramContract.parse({
      ...original,
      proposalId: 'fixture-B-local-difference',
      schedule: { format: 'EXPLICIT_WEEKS', weeks: effective.weeks },
    });
    if (b.schedule.format !== 'EXPLICIT_WEEKS')
      throw new Error('Invalid fixture');
    const target = b.schedule.weeks[2].sessions[1].exercises[2];
    if (target.sets.state !== 'SPECIFIED') throw new Error('Invalid fixture');
    target.sets.value.pop();
    const changed = expandTrainingProgram(construct(b), 52);
    expect(changed.weeks[2].sessions[1].exercises[2].sets).toMatchObject({
      state: 'SPECIFIED',
      value: [expect.anything(), expect.anything()],
    });
    const restored = trainingProgramContract.parse({
      ...b,
      schedule: { format: 'EXPLICIT_WEEKS', weeks: changed.weeks },
    });
    if (restored.schedule.format !== 'EXPLICIT_WEEKS')
      throw new Error('Invalid fixture');
    restored.schedule.weeks[2].sessions[1].exercises[2] =
      plannedWeekContract.parse(effective.weeks[2]).sessions[1].exercises[2];
    expect(restored.schedule.weeks).toEqual(effective.weeks);
    expect(expandTrainingProgram(original, 52)).toEqual(effective);
  });

  it('preserves heterogeneous sets, ranges, units and explicitly omitted intensity', () => {
    const input = trainingProgramContract.parse(rtF04ProposalInput());
    if (input.schedule.format !== 'WEEKLY_TEMPLATE')
      throw new Error('Invalid fixture');
    const sets = input.schedule.sessions[0].exercises[0].sets;
    if (sets.state !== 'SPECIFIED') throw new Error('Invalid fixture');
    sets.value[0].repetitions = {
      state: 'SPECIFIED',
      value: { kind: 'RANGE', min: 6, max: 8 },
    };
    sets.value[0].intensity = {
      state: 'UNSPECIFIED',
      reason: 'Omitted by source',
    };
    sets.value[1].intensity = {
      state: 'SPECIFIED',
      value: { method: 'ABSOLUTE_LOAD', value: 12, unit: 'kg' },
    };
    const result = construct(input);
    expect(
      expandTrainingProgram(result, 52).weeks[0].sessions[0].exercises[0].sets,
    ).toEqual(sets);
    expect(construct(JSON.parse(stableSerialize(result)))).toEqual(result);
  });

  it('has no four-week study requirement and rejects only an explicit expansion resource limit', () => {
    const input = rtF04ProposalInput();
    input.horizon.weeks = 6;
    const result = construct(input);
    expect(expandTrainingProgram(result, 6).weeks).toHaveLength(6);
    expect(() => expandTrainingProgram(result, 5)).toThrow('limit');
  });

  it.each([
    'catalog',
    'snapshot',
    'release',
    'rule-target',
    'rule-week',
    'overlap',
    'duplicate-id',
  ])('rejects inconsistent %s references', (scenario) => {
    const input = rtF04ProposalInput();
    if (scenario === 'catalog')
      input.schedule.sessions[0].exercises[0].catalogRef.version =
        'unavailable';
    if (scenario === 'snapshot') input.caseRef.snapshotId = 'other';
    if (scenario === 'release')
      input.knowledgeReleaseRef = { id: 'other', version: '1' };
    if (scenario === 'rule-target')
      input.schedule.temporalRules[0].exerciseTemplateIds = ['missing'];
    if (scenario === 'rule-week')
      input.schedule.temporalRules[0].weekNumbers = [5];
    if (scenario === 'overlap')
      input.schedule.temporalRules.push({
        ...input.schedule.temporalRules[0],
        ruleId: 'overlapping-rule',
      });
    if (scenario === 'duplicate-id')
      input.schedule.sessions[0].exercises[1].exerciseId =
        input.schedule.sessions[0].exercises[0].exerciseId;
    expect(() => construct(input)).toThrow();
  });

  it('rejects malformed units, reversed ranges and extra fields without normalizing them into omissions', () => {
    const input = rtF04ProposalInput();
    input.schedule.sessions[0].exercises[0].sets.value[0].intensity = {
      state: 'SPECIFIED',
      value: { method: 'RIR', value: 2, unit: 'kg' },
    } as never;
    expect(() => construct(input)).toThrow();
    input.schedule.sessions[0].exercises[0].sets.value[0].repetitions = {
      state: 'SPECIFIED',
      value: { kind: 'RANGE', min: 10, max: 8 },
    };
    input.schedule.sessions[0].exercises[0].sets.value[0].intensity = {
      state: 'UNSPECIFIED',
      reason: 'Missing',
    };
    expect(() => construct(input)).toThrow('range');
    expect(() =>
      construct({ ...rtF04ProposalInput(), email: 'private@example.invalid' }),
    ).toThrow('unexpected');
  });

  it('deep-copies and freezes the proposal and expansion without freezing the caller', () => {
    const input = rtF04ProposalInput();
    const result = construct(input);
    const before = stableSerialize(result);
    input.schedule.sessions[0].exercises[0].sets.value[0].order = 99;
    expect(stableSerialize(result)).toBe(before);
    expect(Object.isFrozen(input.schedule.sessions)).toBe(false);
    const effective = expandTrainingProgram(result, 52);
    expect(
      Object.isFrozen(effective.weeks[0].sessions[0].exercises[0].sets),
    ).toBe(true);
    expect(() =>
      Object.assign(effective.weeks[0], { weekId: 'changed' }),
    ).toThrow();
  });
});
