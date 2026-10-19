// Created by: Codex (AI-assisted), 2026-10-18
import { stableSerialize } from './contract';

describe('stable JSON contract serialization', () => {
  it('sorts object keys but preserves array order and Unicode text', () => {
    expect(stableSerialize({ z: 'prescripción', a: [2, 1] })).toBe(
      '{"a":[2,1],"z":"prescripción"}',
    );
  });
  it.each([
    undefined,
    NaN,
    Infinity,
    new Date('2000-01-01'),
    () => 1,
    Array<unknown>(2),
  ])('rejects non-JSON value %#', (value) => {
    expect(() => stableSerialize(value)).toThrow();
  });
  it('rejects cycles without rejecting shared acyclic values', () => {
    const cycle: Record<string, unknown> = {};
    cycle.self = cycle;
    expect(() => stableSerialize(cycle)).toThrow('cyclic');
    const shared = { value: 1 };
    expect(stableSerialize({ a: shared, b: shared })).toBe(
      '{"a":{"value":1},"b":{"value":1}}',
    );
  });
});
