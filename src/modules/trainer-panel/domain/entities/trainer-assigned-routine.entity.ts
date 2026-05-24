import {
  TrainerPanelDomainError,
  TrainerPanelErrorCode,
} from '../errors/trainer-panel.error';
import { AssignedRoutineStatus } from '../value-objects/assigned-routine-status.vo';
import { RoutineSnapshot } from '../value-objects/routine-snapshot.vo';

export interface TrainerAssignedRoutineProps {
  id: string;
  trainerId: string;
  clientId: string;
  linkId: string;
  routineId: string;
  routineSnapshot: RoutineSnapshot;
  status: AssignedRoutineStatus;
  assignedAt: Date;
  replacedById: string | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export class TrainerAssignedRoutine {
  public readonly id: string;
  public readonly trainerId: string;
  public readonly clientId: string;
  public readonly linkId: string;
  public readonly routineId: string;
  public readonly routineSnapshot: RoutineSnapshot;
  public readonly status: AssignedRoutineStatus;
  public readonly assignedAt: Date;
  public readonly replacedById: string | null;
  public readonly notes: string | null;
  public readonly createdAt: Date;
  public readonly updatedAt: Date;

  private constructor(props: TrainerAssignedRoutineProps) {
    this.id = props.id;
    this.trainerId = props.trainerId;
    this.clientId = props.clientId;
    this.linkId = props.linkId;
    this.routineId = props.routineId;
    this.routineSnapshot = props.routineSnapshot;
    this.status = props.status;
    this.assignedAt = props.assignedAt;
    this.replacedById = props.replacedById;
    this.notes = props.notes;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  static create(props: {
    id: string;
    trainerId: string;
    clientId: string;
    linkId: string;
    routineId: string;
    routineSnapshot: RoutineSnapshot;
    notes?: string | null;
  }): TrainerAssignedRoutine {
    const now = new Date();
    return new TrainerAssignedRoutine({
      id: props.id,
      trainerId: props.trainerId,
      clientId: props.clientId,
      linkId: props.linkId,
      routineId: props.routineId,
      routineSnapshot: props.routineSnapshot,
      status: AssignedRoutineStatus.active(),
      assignedAt: now,
      replacedById: null,
      notes: props.notes ?? null,
      createdAt: now,
      updatedAt: now,
    });
  }

  static reconstitute(
    props: TrainerAssignedRoutineProps,
  ): TrainerAssignedRoutine {
    return new TrainerAssignedRoutine(props);
  }

  replace(
    newId: string,
    newRoutineId: string,
    newSnapshot: RoutineSnapshot,
    notes?: string | null,
  ): TrainerAssignedRoutine {
    if (!this.status.canBeReplaced()) {
      throw new TrainerPanelDomainError(
        TrainerPanelErrorCode.CANNOT_REPLACE_INACTIVE,
        'Cannot replace a routine that is not active',
      );
    }

    const now = new Date();
    return new TrainerAssignedRoutine({
      id: newId,
      trainerId: this.trainerId,
      clientId: this.clientId,
      linkId: this.linkId,
      routineId: newRoutineId,
      routineSnapshot: newSnapshot,
      status: AssignedRoutineStatus.active(),
      assignedAt: now,
      replacedById: null,
      notes: notes ?? null,
      createdAt: now,
      updatedAt: now,
    });
  }

  deactivate(): TrainerAssignedRoutine {
    const now = new Date();
    return new TrainerAssignedRoutine({
      ...this,
      status: AssignedRoutineStatus.inactive(),
      updatedAt: now,
    });
  }

  markAsReplaced(replacedById: string): TrainerAssignedRoutine {
    const now = new Date();
    return new TrainerAssignedRoutine({
      ...this,
      status: AssignedRoutineStatus.replaced(),
      replacedById,
      updatedAt: now,
    });
  }

  updateNotes(notes: string): TrainerAssignedRoutine {
    const now = new Date();
    return new TrainerAssignedRoutine({
      ...this,
      notes,
      updatedAt: now,
    });
  }

  updateSnapshot(snapshot: RoutineSnapshot): TrainerAssignedRoutine {
    if (!this.status.isActive()) {
      throw new TrainerPanelDomainError(
        TrainerPanelErrorCode.CANNOT_REPLACE_INACTIVE,
        'Cannot edit a routine that is not active',
      );
    }
    const now = new Date();
    return new TrainerAssignedRoutine({
      ...this,
      routineSnapshot: snapshot,
      updatedAt: now,
    });
  }
}
