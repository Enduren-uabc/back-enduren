import {
  createCaseStateSnapshot,
  serializeCaseStateSnapshot,
  type CaseStateInput,
} from './case-state';

const observedAt = '2026-10-15T12:00:00.000Z';
const provenance = {
  sourceType: 'SELF_REPORTED' as const,
  sourceRef: 'synthetic-profile-01',
  observedAt,
};

function caseInput(): CaseStateInput {
  return {
    caseId: 'synthetic-case-01',
    snapshotId: 'snapshot-01',
    capturedAt: observedAt,
    fields: {
      goal: { state: 'KNOWN', value: 'hypertrophy', provenance },
      experienceLevel: { state: 'KNOWN', value: 'intermediate', provenance },
      daysAvailablePerWeek: { state: 'NOT_COLLECTED' },
      availableEquipment: {
        state: 'KNOWN',
        value: ['dumbbells', 'bench'],
        provenance,
      },
    },
  };
}

describe('research case snapshot v0', () => {
  it('never replaces an uncollected availability value with the Endure default', () => {
    const snapshot = createCaseStateSnapshot(caseInput());
    expect(snapshot.fields.daysAvailablePerWeek).toEqual({ state: 'NOT_COLLECTED' });
  });

  it('preserves source type when a value originated in a system default', () => {
    const input = caseInput();
    input.fields.daysAvailablePerWeek = {
      state: 'KNOWN',
      value: 3,
      provenance: { ...provenance, sourceType: 'SYSTEM_DEFAULT' },
    };
    const snapshot = createCaseStateSnapshot(input);
    expect(snapshot.fields.daysAvailablePerWeek.provenance?.sourceType).toBe('SYSTEM_DEFAULT');
  });

  it('copies and freezes nested values, not the mutable source object', () => {
    const input = caseInput();
    const snapshot = createCaseStateSnapshot(input);
    if (input.fields.availableEquipment.state !== 'KNOWN') {
      throw new Error('invalid fixture');
    }
    input.fields.availableEquipment.value.push('barbell');
    expect(snapshot.fields.availableEquipment).toMatchObject({
      state: 'KNOWN',
      value: ['dumbbells', 'bench'],
    });
    expect(Object.isFrozen(snapshot.fields)).toBe(true);
    expect(Object.isFrozen(snapshot.fields.availableEquipment)).toBe(true);
  });

  it('rejects invalid availability and fabricated missing-state values', () => {
    const invalid = caseInput();
    invalid.fields.daysAvailablePerWeek = {
      state: 'KNOWN',
      value: 9,
      provenance,
    };
    expect(() => createCaseStateSnapshot(invalid)).toThrow();

    const fabricated = caseInput();
    fabricated.fields.daysAvailablePerWeek = {
      state: 'NOT_COLLECTED',
      value: 3,
    } as unknown as CaseStateInput['fields']['daysAvailablePerWeek'];
    expect(() => createCaseStateSnapshot(fabricated)).toThrow();
  });

  it('serializes equivalent inputs deterministically', () => {
    const a = createCaseStateSnapshot(caseInput());
    const b = createCaseStateSnapshot(caseInput());
    expect(serializeCaseStateSnapshot(a)).toBe(serializeCaseStateSnapshot(b));
  });
});
