// Created by: Codex (AI-assisted), 2026-10-19
import {
  arrayOf,
  enumeration,
  freeze,
  identifier,
  invariant,
  Json,
  objectOf,
  stableSerialize,
} from '../../domain/contract';
import {
  setPrescriptionContract,
  trainingProgramContract,
  TrainingProgramProposal,
} from '../../domain/training-program-proposal';

export const OPENAI_RT_WIRE_VERSION = 'openai-rt-wire/0.1' as const;

const registryContract = arrayOf(
  objectOf({ key: identifier, prescription: setPrescriptionContract }),
);
type RecordJson = { [key: string]: Json };

function record(value: unknown): RecordJson {
  invariant(
    value !== null &&
      typeof value === 'object' &&
      !Array.isArray(value) &&
      (Object.getPrototypeOf(value) === Object.prototype ||
        Object.getPrototypeOf(value) === null),
    'Expected plain object',
  );
  return value as RecordJson;
}

function copyJson(value: unknown): Json {
  return JSON.parse(stableSerialize(value)) as Json;
}

const supportedKeywords = new Set([
  'type',
  'properties',
  'required',
  'additionalProperties',
  'items',
  'minItems',
  'maxItems',
  'minimum',
  'maximum',
  'pattern',
  'enum',
  'anyOf',
]);
const schemaTypes = new Set([
  'object',
  'array',
  'string',
  'number',
  'integer',
  'boolean',
  'null',
]);

function enumType(value: Json): string {
  invariant(
    value === null ||
      typeof value === 'string' ||
      typeof value === 'boolean' ||
      (typeof value === 'number' && Number.isFinite(value)),
    'Unsupported enum value',
  );
  return value === null ? 'null' : typeof value;
}

function disjoint(a: RecordJson, b: RecordJson): boolean {
  // Integer is a subset of number, so those two types are not exclusive.
  if (
    typeof a.type === 'string' &&
    typeof b.type === 'string' &&
    a.type !== b.type &&
    !['integer', 'number'].every((type) => [a.type, b.type].includes(type))
  ) {
    return true;
  }
  if (Array.isArray(a.enum) && Array.isArray(b.enum)) {
    return a.enum.every((value) => !(b.enum as Json[]).includes(value));
  }
  if (a.type !== 'object' || b.type !== 'object') return false;
  const aProperties = record(a.properties);
  const bProperties = record(b.properties);
  return Object.keys(aProperties).some((key) => {
    if (!Object.hasOwn(bProperties, key)) return false;
    const left = record(aProperties[key]).enum;
    const right = record(bProperties[key]).enum;
    return (
      Array.isArray(a.required) &&
      a.required.includes(key) &&
      Array.isArray(b.required) &&
      b.required.includes(key) &&
      Array.isArray(left) &&
      Array.isArray(right) &&
      left.every((value) => !right.includes(value))
    );
  });
}

/**
 * Closed conversion for the S1A vocabulary, not a general schema converter.
 * Any new S1A keyword must be reviewed explicitly before provider preparation.
 */
export function normalizeOpenAISchema(input: unknown): Json {
  const normalize = (value: Json): RecordJson => {
    const source = record(value);
    const result: RecordJson = {};
    for (const [key, child] of Object.entries(source)) {
      if (key === '$schema' || key === '$id') {
        invariant(typeof child === 'string', 'Invalid dialect metadata');
      } else if (key === 'minLength') {
        invariant(
          child === 1 &&
            typeof source.pattern === 'string' &&
            !new RegExp(source.pattern).test(''),
          'Cannot remove minLength without a nonempty pattern guarantee',
        );
      } else if (key === 'properties') {
        result.properties = Object.fromEntries(
          Object.entries(record(child)).map(([name, property]) => [
            name,
            normalize(property),
          ]),
        );
      } else if (key === 'items') {
        result.items = normalize(child);
      } else if (key === 'oneOf' || key === 'anyOf') {
        invariant(
          Array.isArray(child) && child.length >= 2,
          'Expected multiple union branches',
        );
        invariant(
          !(Object.hasOwn(source, 'oneOf') && Object.hasOwn(source, 'anyOf')),
          'Mixed union keywords',
        );
        const variants = child.map(normalize);
        if (key === 'oneOf') {
          invariant(
            variants.every((variant, index) =>
              variants
                .slice(index + 1)
                .every((other) => disjoint(variant, other)),
            ),
            'oneOf branches are not provably disjoint',
          );
        }
        result.anyOf = variants;
      } else {
        invariant(supportedKeywords.has(key), `Unsupported keyword: ${key}`);
        result[key] = child;
      }
    }
    if (Array.isArray(result.enum)) {
      const types = [...new Set(result.enum.map(enumType))];
      invariant(types.length === 1, 'Mixed enum types are unsupported');
      invariant(
        result.type === undefined ||
          result.type === types[0] ||
          (result.type === 'integer' &&
            result.enum.every((value) => Number.isInteger(value))),
        'Enum type conflicts with values',
      );
      result.type ??= types[0];
    }
    return result;
  };
  const normalized = normalize(copyJson(input));
  validateOpenAISchema(normalized);
  return normalized;
}

export interface OpenAISchemaMetrics {
  maxContainerDepth: number;
  propertyCount: number;
  enumValueCount: number;
  stringCharacters: number;
}

/**
 * Offline guard for our documented Structured Outputs subset.
 * Limits: 10 containers (arrays included conservatively), 5,000 properties,
 * 1,000 enum values, 120,000 name/enum characters; enums over 250 values
 * allow at most 15,000 string characters. This does not prove remote acceptance.
 */
export function validateOpenAISchema(input: unknown): OpenAISchemaMetrics {
  const metrics: OpenAISchemaMetrics = {
    maxContainerDepth: 0,
    propertyCount: 0,
    enumValueCount: 0,
    stringCharacters: 0,
  };
  const visit = (value: Json, depth: number, root = false): void => {
    const schema = record(value);
    for (const key of Object.keys(schema)) {
      invariant(supportedKeywords.has(key), `Unsupported keyword: ${key}`);
    }
    if (Object.hasOwn(schema, 'anyOf')) {
      invariant(
        !root &&
          Object.keys(schema).length === 1 &&
          Array.isArray(schema.anyOf) &&
          schema.anyOf.length >= 2,
        'Invalid anyOf position or shape',
      );
      schema.anyOf.forEach((branch) => visit(branch, depth));
      return;
    }
    invariant(
      typeof schema.type === 'string' && schemaTypes.has(schema.type),
      'Schema requires an explicit supported type',
    );
    invariant(!root || schema.type === 'object', 'Root must be an object');
    const container = schema.type === 'object' || schema.type === 'array';
    const currentDepth = depth + Number(container);
    metrics.maxContainerDepth = Math.max(
      metrics.maxContainerDepth,
      currentDepth,
    );
    invariant(currentDepth <= 10, 'Schema exceeds 10 container levels');

    const typeKeywords: Record<string, string[]> = {
      object: ['properties', 'required', 'additionalProperties'],
      array: ['items', 'minItems', 'maxItems'],
      string: ['pattern', 'enum'],
      number: ['minimum', 'maximum', 'enum'],
      integer: ['minimum', 'maximum', 'enum'],
      boolean: ['enum'],
      null: ['enum'],
    };
    invariant(
      Object.keys(schema).every(
        (key) =>
          key === 'type' || typeKeywords[schema.type as string].includes(key),
      ),
      'Keyword does not match schema type',
    );
    if (schema.type === 'object') {
      const properties = record(schema.properties);
      const names = Object.keys(properties);
      invariant(
        schema.additionalProperties === false &&
          Array.isArray(schema.required) &&
          schema.required.length === names.length &&
          new Set(schema.required).size === names.length &&
          names.every((name) => (schema.required as Json[]).includes(name)),
        'Objects must be closed and require every property',
      );
      metrics.propertyCount += names.length;
      metrics.stringCharacters += names.reduce(
        (sum, name) => sum + name.length,
        0,
      );
      Object.values(properties).forEach((child) => visit(child, currentDepth));
    }
    if (schema.type === 'array') visit(schema.items, currentDepth);
    for (const bound of ['minItems', 'maxItems', 'minimum', 'maximum']) {
      if (!Object.hasOwn(schema, bound)) continue;
      invariant(
        typeof schema[bound] === 'number' &&
          Number.isFinite(schema[bound]) &&
          (!bound.endsWith('Items') ||
            (Number.isInteger(schema[bound]) && schema[bound] >= 0)),
        'Invalid numeric schema bound',
      );
    }
    for (const [lower, upper] of [
      ['minItems', 'maxItems'],
      ['minimum', 'maximum'],
    ]) {
      if (schema[lower] !== undefined && schema[upper] !== undefined) {
        invariant(
          (schema[lower] as number) <= (schema[upper] as number),
          'Reversed schema bounds',
        );
      }
    }
    if (Object.hasOwn(schema, 'pattern')) {
      invariant(typeof schema.pattern === 'string', 'Invalid pattern');
      new RegExp(schema.pattern);
    }
    if (Object.hasOwn(schema, 'enum')) {
      invariant(
        Array.isArray(schema.enum) &&
          schema.enum.length > 0 &&
          new Set(schema.enum).size === schema.enum.length &&
          schema.enum.every(
            (item) =>
              enumType(item) === schema.type ||
              (schema.type === 'integer' &&
                typeof item === 'number' &&
                Number.isInteger(item)),
          ),
        'Invalid typed enum',
      );
      const characters = schema.enum.reduce<number>(
        (sum, item) => sum + (typeof item === 'string' ? item.length : 0),
        0,
      );
      invariant(
        schema.enum.length <= 250 || characters <= 15000,
        'Large enum exceeds character limit',
      );
      metrics.enumValueCount += schema.enum.length;
      metrics.stringCharacters += characters;
    }
  };
  visit(copyJson(input), 0, true);
  invariant(metrics.propertyCount <= 5000, 'Too many schema properties');
  invariant(metrics.enumValueCount <= 1000, 'Too many enum values');
  invariant(metrics.stringCharacters <= 120000, 'Schema string limit exceeded');
  return metrics;
}

function buildWireSchema(): Json {
  const root = record(copyJson(trainingProgramContract.schema));
  let replacements = 0;
  const replaceSets = (value: Json): void => {
    if (Array.isArray(value)) {
      value.forEach(replaceSets);
    } else if (value !== null && typeof value === 'object') {
      if (value.type === 'object') {
        const properties = record(value.properties);
        for (const name of ['sets', 'replacementSets']) {
          if (!Object.hasOwn(properties, name)) continue;
          const variants = record(properties[name]).oneOf;
          invariant(Array.isArray(variants), 'Changed S1A sets contract');
          const specified = record(record(variants[0]).properties);
          invariant(
            record(specified.value).type === 'array',
            'Changed S1A sets value',
          );
          record(specified.value).items = copyJson(identifier.schema);
          replacements++;
        }
      }
      Object.values(value).forEach(replaceSets);
    }
  };
  replaceSets(root);
  invariant(replacements === 3, 'Changed S1A prescription locations');
  const properties = record(root.properties);
  properties.transportSchemaVersion = enumeration(
    OPENAI_RT_WIRE_VERSION,
  ).schema;
  properties.setPrescriptions = registryContract.schema;
  root.required = Object.keys(properties);
  return freeze<unknown>(normalizeOpenAISchema(root)) as Json;
}

export const OPENAI_RT_WIRE_SCHEMA: Json = buildWireSchema();

function mapSets(value: Json, transform: (sets: Json[]) => Json[]): Json {
  if (Array.isArray(value))
    return value.map((child) => mapSets(child, transform));
  if (value === null || typeof value !== 'object') return value;
  return Object.fromEntries(
    Object.entries(value).map(([key, child]) => {
      if (key === 'sets' || key === 'replacementSets') {
        const sets = record(child);
        if (sets.state === 'SPECIFIED') {
          invariant(Array.isArray(sets.value), 'Invalid specified sets array');
          return [key, { ...sets, value: transform(sets.value) }];
        }
      }
      return [key, mapSets(child, transform)];
    }),
  );
}

/** Deterministic transport keys preserve occurrences, array order and omissions. */
export function encodeRTWire(proposal: TrainingProgramProposal): Json {
  const source = copyJson(trainingProgramContract.parse(proposal));
  const entries: Json[] = [];
  const result = record(
    mapSets(source, (sets) =>
      sets.map((prescription) => {
        const key = `set-${entries.length + 1}`;
        entries.push({ key, prescription });
        return key;
      }),
    ),
  );
  return {
    ...result,
    transportSchemaVersion: OPENAI_RT_WIRE_VERSION,
    setPrescriptions: entries,
  };
}

/**
 * Only reconstructs and parses S1A shape. The workflow MUST subsequently call
 * createTrainingProgramProposal with the persisted knowledge release/snapshot.
 */
export function decodeRTWire(input: unknown): unknown {
  const source = record(copyJson(input));
  invariant(
    source.transportSchemaVersion === OPENAI_RT_WIRE_VERSION,
    'Unsupported transportSchemaVersion',
  );
  const entries = registryContract.parse(source.setPrescriptions);
  const prescriptions = new Map<string, Json>();
  for (const entry of entries) {
    invariant(!prescriptions.has(entry.key), 'Duplicate prescription key');
    prescriptions.set(entry.key, copyJson(entry.prescription));
  }
  const used = new Set<string>();
  const { transportSchemaVersion, setPrescriptions, ...proposal } = source;
  void transportSchemaVersion;
  void setPrescriptions;
  const reconstructed = mapSets(proposal, (keys) =>
    keys.map((reference) => {
      const key = identifier.parse(reference);
      invariant(prescriptions.has(key), 'Missing prescription reference');
      used.add(key);
      return copyJson(prescriptions.get(key));
    }),
  );
  invariant(used.size === prescriptions.size, 'Orphan prescription entry');
  return trainingProgramContract.parse(reconstructed);
}
