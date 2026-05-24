export type AssignedRoutineStatusType = 'active' | 'inactive' | 'replaced';

export class AssignedRoutineStatus {
  private constructor(public readonly value: AssignedRoutineStatusType) {}

  static active(): AssignedRoutineStatus {
    return new AssignedRoutineStatus('active');
  }

  static inactive(): AssignedRoutineStatus {
    return new AssignedRoutineStatus('inactive');
  }

  static replaced(): AssignedRoutineStatus {
    return new AssignedRoutineStatus('replaced');
  }

  static from(value: string): AssignedRoutineStatus {
    if (!['active', 'inactive', 'replaced'].includes(value)) {
      throw new Error(`Invalid AssignedRoutineStatus: ${value}`);
    }
    return new AssignedRoutineStatus(value as AssignedRoutineStatusType);
  }

  isActive(): boolean {
    return this.value === 'active';
  }

  canBeReplaced(): boolean {
    return this.value === 'active';
  }
}
