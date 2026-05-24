import { ExerciseSnapshot } from './exercise-snapshot.vo';
import { RoutineDaySnapshot } from './routine-day-snapshot.vo';

export interface RoutineSnapshotProps {
  routineId: string;
  name: string;
  description: string;
  difficulty: string;
  estimatedDuration: number;
  exercises: ExerciseSnapshot[];
  days?: RoutineDaySnapshot[];
}

export class RoutineSnapshot {
  public readonly routineId: string;
  public readonly name: string;
  public readonly description: string;
  public readonly difficulty: string;
  public readonly estimatedDuration: number;
  public readonly exercises: ExerciseSnapshot[];
  public readonly days: RoutineDaySnapshot[];

  private constructor(props: RoutineSnapshotProps) {
    this.routineId = props.routineId;
    this.name = props.name;
    this.description = props.description;
    this.difficulty = props.difficulty;
    this.estimatedDuration = props.estimatedDuration;
    this.exercises = props.exercises;
    this.days = props.days ?? [];
  }

  static create(props: RoutineSnapshotProps): RoutineSnapshot {
    if (!props.name || props.name.trim().length === 0) {
      throw new Error('RoutineSnapshot name is required');
    }
    return new RoutineSnapshot(props);
  }

  static reconstitute(props: RoutineSnapshotProps): RoutineSnapshot {
    return new RoutineSnapshot(props);
  }
}
