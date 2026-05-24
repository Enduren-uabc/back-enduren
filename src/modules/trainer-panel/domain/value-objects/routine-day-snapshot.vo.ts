import { ExerciseSnapshot } from './exercise-snapshot.vo';

export interface RoutineDaySnapshotProps {
  dayOfWeek: string;
  exercises: ExerciseSnapshot[];
}

export class RoutineDaySnapshot {
  public readonly dayOfWeek: string;
  public readonly exercises: ExerciseSnapshot[];

  private constructor(props: RoutineDaySnapshotProps) {
    this.dayOfWeek = props.dayOfWeek;
    this.exercises = props.exercises;
  }

  static create(props: RoutineDaySnapshotProps): RoutineDaySnapshot {
    return new RoutineDaySnapshot(props);
  }

  static reconstitute(props: RoutineDaySnapshotProps): RoutineDaySnapshot {
    return new RoutineDaySnapshot(props);
  }
}
