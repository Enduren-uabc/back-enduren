// Created by: Codex (AI-assisted), 2026-10-19
import {
  arrayOf,
  enumeration,
  Json,
  numberContract,
  objectOf,
  oneOf,
  stableSerialize,
  textContract,
} from '../../domain/contract';
import {
  createTrainingProgramProposal,
  expandTrainingProgram,
  TRAINING_PROGRAM_OUTPUT_SCHEMA,
  trainingProgramContract,
} from '../../domain/training-program-proposal';
import {
  createRtF04Case,
  createRtF04Knowledge,
  createRtF04Proposal,
  rtF04ProposalInput,
} from '../../fixtures/rt-f04.fixture';
import {
  decodeRTWire,
  encodeRTWire,
  normalizeOpenAISchema,
  OPENAI_RT_WIRE_SCHEMA,
  OPENAI_RT_WIRE_VERSION,
  validateOpenAISchema,
} from './openai-rt-wire';

type MutableJson = { [key: string]: Json };
function obj(value: Json): MutableJson {
  if (value === null || typeof value !== 'object' || Array.isArray(value))
    throw new Error('Expected fixture object');
  return value;
}
function arr(value: Json): Json[] {
  if (!Array.isArray(value)) throw new Error('Expected fixture array');
  return value;
}
const construct = (input: unknown) =>
  createTrainingProgramProposal(
    input,
    createRtF04Knowledge(),
    createRtF04Case(),
  );
const wireFixture = () => obj(encodeRTWire(createRtF04Proposal()));
const firstSets = (wire: MutableJson) =>
  obj(obj(arr(obj(arr(obj(wire.schedule).sessions)[0]).exercises)[0]).sets);
const registry = (wire: MutableJson) => arr(wire.setPrescriptions);
const firstPrescription = (wire: MutableJson) =>
  obj(obj(registry(wire)[0]).prescription);
const wrapped = (schema: Json): Json => ({
  type: 'object',
  properties: { value: schema },
  required: ['value'],
  additionalProperties: false,
});

describe('openai-rt-wire/0.1 reversible prescription registry', () => {
  it.each(['WEEKLY_TEMPLATE', 'EXPLICIT_WEEKS'])(
    'preserves canonical proposal and effective prescriptions for %s',
    (format) => {
      const a = createRtF04Proposal();
      const source =
        format === 'WEEKLY_TEMPLATE'
          ? a
          : construct({
              ...a,
              proposalId: 'fixture-B',
              schedule: {
                format: 'EXPLICIT_WEEKS',
                weeks: expandTrainingProgram(a, 52).weeks,
              },
            });
      const wire = obj(encodeRTWire(source));
      expect(wire.transportSchemaVersion).toBe(OPENAI_RT_WIRE_VERSION);
      const restored = construct(decodeRTWire(wire));
      expect(stableSerialize(restored)).toBe(stableSerialize(source));
      expect(expandTrainingProgram(restored, 52)).toEqual(
        expandTrainingProgram(source, 52),
      );
      expect(encodeRTWire(restored)).toEqual(wire);
      expect(registry(wire).length).toBeGreaterThan(0);
      expect(wire).not.toHaveProperty(
        'transportSchemaVersion',
        source.schemaVersion,
      );
    },
  );

  it('preserves heterogeneous repetitions/intensity, omissions and temporal replacements', () => {
    const input = trainingProgramContract.parse(rtF04ProposalInput());
    if (input.schedule.format !== 'WEEKLY_TEMPLATE') throw new Error('fixture');
    const sets = input.schedule.sessions[0].exercises[0].sets;
    if (sets.state !== 'SPECIFIED') throw new Error('fixture');
    sets.value[0].repetitions = {
      state: 'SPECIFIED',
      value: { kind: 'RANGE', min: 6, max: 8 },
    };
    sets.value[0].intensity = {
      state: 'SPECIFIED',
      value: { method: 'RPE', value: 7, unit: 'score', scale: 'RPE_0_10' },
    };
    sets.value[1].intensity = {
      state: 'SPECIFIED',
      value: { method: 'PERCENT_1RM', value: 70, unit: 'percent_1rm' },
    };
    sets.value[1].restBetweenSets = {
      state: 'NOT_APPLICABLE',
      reason: 'Last set',
    };
    input.schedule.sessions[0].exercises[1].sets = {
      state: 'UNSPECIFIED',
      reason: 'Omitted by source',
    };
    input.schedule.sessions[0].exercises[2].catalogRef = null;
    const source = construct(input);
    const wire = obj(encodeRTWire(source));
    const replacement = obj(
      obj(arr(obj(wire.schedule).temporalRules)[0]).replacementSets,
    );
    expect(
      arr(replacement.value).every((value) => typeof value === 'string'),
    ).toBe(true);
    expect(decodeRTWire(wire)).toEqual(source);
    expect(construct(decodeRTWire(wire))).toEqual(source);
  });

  it('keeps transport keys independent of repeated domain set identities', () => {
    const wire = wireFixture();
    const entries = registry(wire).map(obj);
    const keys = entries.map((entry) => entry.key);
    const ids = entries.map((entry) => obj(entry.prescription).setId);
    expect(new Set(keys).size).toBe(keys.length);
    expect(new Set(ids).size).toBeLessThan(ids.length);
    const original = stableSerialize(wire);
    decodeRTWire(wire);
    expect(stableSerialize(wire)).toBe(original);
  });

  it('preserves absolute-load and RPE 6–20 prescriptions and specified-state omissions', () => {
    const input = trainingProgramContract.parse(rtF04ProposalInput());
    if (input.schedule.format !== 'WEEKLY_TEMPLATE') throw new Error('fixture');
    const exercise = input.schedule.sessions[0].exercises[0];
    if (exercise.sets.state !== 'SPECIFIED') throw new Error('fixture');
    exercise.sets.value[0].intensity = {
      state: 'SPECIFIED',
      value: { method: 'ABSOLUTE_LOAD', value: 12.5, unit: 'kg' },
    };
    exercise.sets.value[1].intensity = {
      state: 'SPECIFIED',
      value: { method: 'RPE', value: 16, unit: 'score', scale: 'RPE_6_20' },
    };
    exercise.sets.value[0].repetitions = {
      state: 'UNSPECIFIED',
      reason: 'Not prescribed',
    };
    exercise.restBetweenExercises = {
      state: 'NOT_APPLICABLE',
      reason: 'Last exercise',
    };
    const source = construct(input);
    expect(construct(decodeRTWire(encodeRTWire(source)))).toEqual(source);
  });

  it.each([
    'version',
    'duplicate-key',
    'missing-reference',
    'orphan',
    'unknown-root',
    'unknown-registry',
    'unknown-prescription',
    'unknown-sets',
    'mixed-branch',
    'unknown-branch',
    'wrong-unit',
    'empty-specified',
    'nonstring-reference',
    'missing-registry',
    'mixed-repetitions',
    'mixed-intensity',
    'extra-schedule',
    'mixed-schedule',
  ])('rejects malformed %s', (scenario) => {
    const wire = wireFixture();
    const entries = registry(wire);
    if (scenario === 'version') wire.transportSchemaVersion = 'other/0.1';
    if (scenario === 'duplicate-key') entries.push(entries[0]);
    if (scenario === 'missing-reference') firstSets(wire).value = ['absent'];
    if (scenario === 'orphan')
      entries.push({ ...obj(entries[0]), key: 'orphan' });
    if (scenario === 'unknown-root') wire.unexpected = true;
    if (scenario === 'unknown-registry') obj(entries[0]).unexpected = true;
    if (scenario === 'unknown-prescription')
      firstPrescription(wire).unexpected = true;
    if (scenario === 'unknown-sets') firstSets(wire).unexpected = true;
    if (scenario === 'mixed-branch') firstSets(wire).reason = 'Mixed variant';
    if (scenario === 'unknown-branch') firstSets(wire).state = 'UNKNOWN';
    if (scenario === 'wrong-unit')
      obj(obj(firstPrescription(wire).intensity).value).unit = 'kg';
    if (scenario === 'empty-specified') firstSets(wire).value = [];
    if (scenario === 'nonstring-reference') firstSets(wire).value = [42];
    if (scenario === 'missing-registry') delete wire.setPrescriptions;
    if (scenario === 'mixed-repetitions')
      obj(obj(firstPrescription(wire).repetitions).value).min = 6;
    if (scenario === 'mixed-intensity')
      obj(obj(firstPrescription(wire).intensity).value).scale = 'RPE_0_10';
    if (scenario === 'extra-schedule') obj(wire.schedule).unexpected = true;
    if (scenario === 'mixed-schedule') obj(wire.schedule).weeks = [];
    expect(() => decodeRTWire(wire)).toThrow();
  });

  it('leaves semantic validation to the mandatory S1A factory after shape reconstruction', () => {
    const wire = wireFixture();
    firstPrescription(wire).repetitions = {
      state: 'SPECIFIED',
      value: { kind: 'RANGE', min: 12, max: 8 },
    };
    const reconstructed = decodeRTWire(wire);
    expect(() => construct(reconstructed)).toThrow('range');
    wire.caseRef = { caseId: 'RT-F04', snapshotId: 'unavailable' };
    expect(() => construct(decodeRTWire(wire))).toThrow();
  });
});

describe('closed provider schema conversion and offline compatibility limits', () => {
  it('keeps S1A unchanged and reduces the full wire schema to at most 10 containers', () => {
    const original = stableSerialize(TRAINING_PROGRAM_OUTPUT_SCHEMA);
    const metrics = validateOpenAISchema(OPENAI_RT_WIRE_SCHEMA);
    expect(metrics.maxContainerDepth).toBeLessThanOrEqual(10);
    expect(metrics.propertyCount).toBeLessThanOrEqual(5000);
    expect(metrics.enumValueCount).toBeLessThanOrEqual(1000);
    expect(metrics.stringCharacters).toBeLessThanOrEqual(120000);
    expect(stableSerialize(TRAINING_PROGRAM_OUTPUT_SCHEMA)).toBe(original);
    expect(Object.isFrozen(OPENAI_RT_WIRE_SCHEMA)).toBe(true);
    const serialized = JSON.stringify(OPENAI_RT_WIRE_SCHEMA);
    expect(serialized).not.toMatch(/"oneOf"|"minLength"|"\$schema"|"\$id"/);
    expect(serialized).toContain('"anyOf"');
    expect(serialized).toContain('"additionalProperties":false');
    expect(() => normalizeOpenAISchema(TRAINING_PROGRAM_OUTPUT_SCHEMA)).toThrow(
      'container',
    );
  });

  it.each([
    oneOf(objectOf({ id: textContract() }), enumeration(null)).schema,
    oneOf(
      objectOf({ state: enumeration('A'), value: numberContract(0) }),
      objectOf({ state: enumeration('B', 'C'), reason: textContract() }),
    ).schema,
    oneOf(enumeration('A'), enumeration('B')).schema,
  ])('normalizes only provably exclusive unions', (schema) => {
    const normalized = normalizeOpenAISchema(wrapped(schema));
    expect(JSON.stringify(normalized)).toContain('"anyOf"');
    expect(() => validateOpenAISchema(normalized)).not.toThrow();
  });

  it.each([
    oneOf(numberContract(0), numberContract(1, true)).schema,
    oneOf(enumeration('A', 'B'), enumeration('B', 'C')).schema,
    oneOf(
      objectOf({ first: textContract() }),
      objectOf({ second: textContract() }),
    ).schema,
    {
      oneOf: [
        {
          type: 'object',
          properties: { state: { enum: ['A'] } },
          required: [],
          additionalProperties: false,
        },
        {
          type: 'object',
          properties: { state: { enum: ['B'] } },
          required: [],
          additionalProperties: false,
        },
      ],
    },
  ])(
    'rejects unions without a proven required discriminant or disjoint type',
    (schema) => {
      expect(() => normalizeOpenAISchema(wrapped(schema))).toThrow();
    },
  );

  it.each<Json>([
    { type: 'string', minLength: 1 },
    { type: 'string', minLength: 1, pattern: '^.*$' },
    { type: 'string', minLength: 2, pattern: '\\S' },
    { type: 'string', format: 'email' },
    { type: 'string', unknownKeyword: true },
    { type: 'string', enum: [false] },
    { enum: ['text', null] },
    { $ref: '#/$defs/item' },
    { type: 'object', properties: {}, required: [] },
  ])('rejects lossy or unknown schema constructions', (schema) => {
    expect(() => normalizeOpenAISchema(wrapped(schema))).toThrow();
  });

  it('retains a nonempty pattern when dropping redundant minLength and types null enums', () => {
    const normalized = obj(
      normalizeOpenAISchema(
        objectOf({ text: textContract(), empty: enumeration(null) }).schema,
      ),
    );
    expect(obj(normalized.properties).text).toEqual({
      type: 'string',
      pattern: '\\S',
    });
    expect(obj(normalized.properties).empty).toEqual({
      type: 'null',
      enum: [null],
    });
  });

  it('counts arrays as container levels and rejects level 11', () => {
    let nested: Json = { type: 'string' };
    for (let level = 0; level < 9; level++)
      nested = { type: 'array', items: nested };
    expect(validateOpenAISchema(wrapped(nested)).maxContainerDepth).toBe(10);
    expect(() =>
      validateOpenAISchema(wrapped({ type: 'array', items: nested })),
    ).toThrow('container');
  });

  it('enforces required fields, closed objects and the root-object rule', () => {
    const schema = obj(wrapped({ type: 'string' }));
    expect(() => validateOpenAISchema({ ...schema, required: [] })).toThrow();
    expect(() =>
      validateOpenAISchema({ ...schema, additionalProperties: true }),
    ).toThrow();
    expect(() =>
      validateOpenAISchema(arrayOf(textContract()).schema),
    ).toThrow();
    expect(() => validateOpenAISchema({ anyOf: [schema, schema] })).toThrow();
  });

  it('enforces the total property limit at the boundary', () => {
    const properties = Object.fromEntries(
      Array.from({ length: 5000 }, (_, index) => [
        `p${index}`,
        { type: 'null' },
      ]),
    );
    const schema = {
      type: 'object',
      properties,
      required: Object.keys(properties),
      additionalProperties: false,
    };
    expect(validateOpenAISchema(schema).propertyCount).toBe(5000);
    properties.extra = { type: 'null' };
    schema.required.push('extra');
    expect(() => validateOpenAISchema(schema)).toThrow('properties');
  });

  it('enforces total enum count and individual large-enum string limits', () => {
    const values = Array.from({ length: 1000 }, (_, index) => `v${index}`);
    expect(
      validateOpenAISchema(wrapped({ type: 'string', enum: values }))
        .enumValueCount,
    ).toBe(1000);
    expect(() =>
      validateOpenAISchema(
        wrapped({ type: 'string', enum: [...values, 'extra'] }),
      ),
    ).toThrow('enum values');
    const longValues = Array.from(
      { length: 251 },
      (_, index) => `${index}${'x'.repeat(60)}`,
    );
    expect(() =>
      validateOpenAISchema(wrapped({ type: 'string', enum: longValues })),
    ).toThrow('Large enum');
  });

  it('enforces schema string length and rejects invalid final schema types or bounds', () => {
    expect(() =>
      validateOpenAISchema(
        wrapped({ type: 'string', enum: ['x'.repeat(120000)] }),
      ),
    ).toThrow('string limit');
    const invalidSchemas: Json[] = [
      { enum: ['A'] },
      { type: 'string', enum: ['A', 'A'] },
      { type: 'array', items: { type: 'string' }, minItems: -1 },
      { type: 'number', minimum: 5, maximum: 4 },
      { type: 'string', minimum: 0 },
    ];
    for (const invalid of invalidSchemas) {
      expect(() => validateOpenAISchema(wrapped(invalid))).toThrow();
    }
  });
});
