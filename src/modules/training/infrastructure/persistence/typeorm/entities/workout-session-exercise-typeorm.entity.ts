import {
  Entity,
  PrimaryColumn,
  Column,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { WorkoutSessionTypeormEntity } from './workout-session-typeorm.entity';
import { WorkoutSessionSetTypeormEntity } from './workout-session-set-typeorm.entity';

export interface WorkoutSessionTargetSetJson {
  setNumber: number;
  reps: number;
  weight: number;
}

@Entity('workout_session_exercises')
export class WorkoutSessionExerciseTypeormEntity {
  @PrimaryColumn('uuid')
  id!: string;

  @Column('uuid', { name: 'session_id' })
  sessionId!: string;

  @Column('uuid', { name: 'exercise_id' })
  exerciseId!: string;

  @Column('varchar', { name: 'exercise_name' })
  exerciseName!: string;

  @Column('int', { name: 'order_index' })
  orderIndex!: number;

  @Column('simple-json', { name: 'target_sets', nullable: true })
  targetSets!: WorkoutSessionTargetSetJson[] | null;

  @ManyToOne(
    () => WorkoutSessionTypeormEntity,
    (session) => session.exercises,
    { onDelete: 'CASCADE' },
  )
  @JoinColumn({ name: 'session_id' })
  session!: WorkoutSessionTypeormEntity;

  @OneToMany(
    () => WorkoutSessionSetTypeormEntity,
    (set) => set.sessionExercise,
    { cascade: true, eager: true },
  )
  workoutSets!: WorkoutSessionSetTypeormEntity[];
}
