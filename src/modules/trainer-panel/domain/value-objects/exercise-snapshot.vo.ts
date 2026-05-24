export interface ExerciseSnapshotProps {
  exerciseId: string;
  name: string;
  sets: number;
  reps: number;
  restSeconds: number;
  order: number;
}

export class ExerciseSnapshot {
  public readonly exerciseId: string;
  public readonly name: string;
  public readonly sets: number;
  public readonly reps: number;
  public readonly restSeconds: number;
  public readonly order: number;

  private constructor(props: ExerciseSnapshotProps) {
    this.exerciseId = props.exerciseId;
    this.name = props.name;
    this.sets = props.sets;
    this.reps = props.reps;
    this.restSeconds = props.restSeconds;
    this.order = props.order;
  }

  static create(props: ExerciseSnapshotProps): ExerciseSnapshot {
    return new ExerciseSnapshot(props);
  }

  static reconstitute(props: ExerciseSnapshotProps): ExerciseSnapshot {
    return new ExerciseSnapshot(props);
  }
}
