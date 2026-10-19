// Created by: Codex (AI-assisted), 2026-10-18

/** Small, closed contract vocabulary; not an interpreter for arbitrary JSON Schema. */
export type Json =
  | null
  | boolean
  | number
  | string
  | Json[]
  | { [key: string]: Json };
export type DeepReadonly<T> = T extends object
  ? { readonly [K in keyof T]: DeepReadonly<T[K]> }
  : T;

export interface Contract<T> {
  readonly schema: Json;
  parse(value: unknown, path?: string): T;
}
export type ValueOf<C> = C extends Contract<infer T> ? T : never;

export function invariant(
  condition: unknown,
  message: string,
): asserts condition {
  if (!condition) throw new Error(message);
}

export function freeze<T>(value: T): DeepReadonly<T> {
  if (value !== null && typeof value === 'object') {
    Object.values(value).forEach((child: unknown) => freeze(child));
    Object.freeze(value);
  }
  return value as DeepReadonly<T>;
}

export function stableSerialize(value: unknown): string {
  const ancestors = new Set<object>();
  const serialize = (entry: unknown): string => {
    if (entry === null) return 'null';
    if (typeof entry === 'string' || typeof entry === 'boolean')
      return JSON.stringify(entry);
    if (typeof entry === 'number') {
      invariant(Number.isFinite(entry), 'Cannot serialize non-finite number');
      return JSON.stringify(entry);
    }
    invariant(typeof entry === 'object', 'Only JSON values can be serialized');
    invariant(!ancestors.has(entry), 'Cannot serialize cyclic data');
    ancestors.add(entry);
    let result: string;
    if (Array.isArray(entry)) {
      invariant(
        Object.keys(entry).length === entry.length,
        'Sparse/decorated arrays are not JSON contracts',
      );
      result = `[${entry.map(serialize).join(',')}]`;
    } else {
      invariant(
        Object.getPrototypeOf(entry) === Object.prototype ||
          Object.getPrototypeOf(entry) === null,
        'Only plain objects can be serialized',
      );
      const record = entry as Record<string, unknown>;
      result = `{${Object.keys(record)
        .sort()
        .map((key) => `${JSON.stringify(key)}:${serialize(record[key])}`)
        .join(',')}}`;
    }
    ancestors.delete(entry);
    return result;
  };
  return serialize(value);
}

export function textContract(pattern?: string): Contract<string> {
  return {
    schema: { type: 'string', minLength: 1, pattern: pattern ?? '\\S' },
    parse(value, path = '$') {
      invariant(
        typeof value === 'string' && value.trim().length > 0,
        `${path}: expected nonempty text`,
      );
      invariant(
        !pattern || new RegExp(pattern).test(value),
        `${path}: invalid text format`,
      );
      return value;
    },
  };
}

export function numberContract(
  minimum: number,
  integer = false,
  maximum?: number,
): Contract<number> {
  return {
    schema: {
      type: integer ? 'integer' : 'number',
      minimum,
      ...(maximum === undefined ? {} : { maximum }),
    },
    parse(value, path = '$') {
      invariant(
        typeof value === 'number' &&
          Number.isFinite(value) &&
          value >= minimum &&
          (!integer || Number.isInteger(value)) &&
          (maximum === undefined || value <= maximum),
        `${path}: invalid number`,
      );
      return value;
    },
  };
}

export function enumeration<
  const T extends readonly (string | boolean | null)[],
>(...values: T): Contract<T[number]> {
  return {
    schema: { enum: [...values] },
    parse(value, path = '$') {
      invariant(
        values.some((candidate) => candidate === value),
        `${path}: unsupported value`,
      );
      return value as T[number];
    },
  };
}

export function arrayOf<T>(element: Contract<T>, minItems = 0): Contract<T[]> {
  return {
    schema: { type: 'array', items: element.schema, minItems },
    parse(value, path = '$') {
      invariant(
        Array.isArray(value) && value.length >= minItems,
        `${path}: invalid array`,
      );
      invariant(
        Object.keys(value).length === value.length,
        `${path}: sparse/decorated array`,
      );
      return value.map((entry: unknown, index) =>
        element.parse(entry, `${path}/${index}`),
      );
    },
  };
}

export function objectOf<S extends Record<string, Contract<unknown>>>(
  shape: S,
): Contract<{ [K in keyof S]: ValueOf<S[K]> }> {
  type Result = { [K in keyof S]: ValueOf<S[K]> };
  return {
    schema: {
      type: 'object',
      properties: Object.fromEntries(
        Object.entries(shape).map(([key, contract]) => [key, contract.schema]),
      ),
      required: Object.keys(shape),
      additionalProperties: false,
    },
    parse(value, path = '$') {
      invariant(
        value !== null && typeof value === 'object' && !Array.isArray(value),
        `${path}: expected object`,
      );
      invariant(
        Object.getPrototypeOf(value) === Object.prototype ||
          Object.getPrototypeOf(value) === null,
        `${path}: expected plain object`,
      );
      const record = value as Record<string, unknown>;
      invariant(
        Object.keys(record).every((key) => Object.hasOwn(shape, key)),
        `${path}: unexpected fields`,
      );
      return Object.fromEntries(
        Object.entries(shape).map(([key, contract]) => {
          invariant(
            Object.hasOwn(record, key),
            `${path}/${key}: required field`,
          );
          return [key, contract.parse(record[key], `${path}/${key}`)];
        }),
      ) as Result;
    },
  };
}

export function oneOf<const C extends readonly Contract<unknown>[]>(
  ...choices: C
): Contract<ValueOf<C[number]>> {
  return {
    schema: { oneOf: choices.map((choice) => choice.schema) },
    parse(value, path = '$') {
      const successes: unknown[] = [];
      for (const choice of choices) {
        try {
          successes.push(choice.parse(value, path));
        } catch {
          /* Try the next closed variant. */
        }
      }
      invariant(
        successes.length === 1,
        `${path}: expected exactly one contract variant`,
      );
      return successes[0] as ValueOf<C[number]>;
    },
  };
}

export const identifier = textContract('^[A-Za-z0-9][A-Za-z0-9._-]*$');
export const versionRef = objectOf({ id: identifier, version: textContract() });
export type VersionRef = ValueOf<typeof versionRef>;

export function refKey(ref: VersionRef): string {
  return stableSerialize(ref);
}
export function unique(values: readonly string[], label: string): void {
  invariant(
    new Set(values).size === values.length,
    `${label}: duplicate identity`,
  );
}

export function specified<T>(contract: Contract<T>) {
  return oneOf(
    objectOf({ state: enumeration('SPECIFIED'), value: contract }),
    objectOf({
      state: enumeration('UNSPECIFIED', 'NOT_APPLICABLE'),
      reason: textContract(),
    }),
  );
}
