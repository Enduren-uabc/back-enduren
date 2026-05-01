import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  OneToMany,
} from 'typeorm';
import { WorkoutSessionExerciseTypeormEntity } from './workout-session-exercise-typeorm.entity';

@Entity('workout_sessions')
export class WorkoutSessionTypeormEntity {
  @PrimaryColumn('uuid')
  id!: string;

  @Column('uuid')
  userId!: string;

  @Column('uuid')
  routineId!: string;

  @Column('varchar')
  status!: string;

  @Column('int', { default: 0 })
  currentExerciseIndex!: number;

  @CreateDateColumn()
  startedAt!: Date;

  @Column('timestamptz', { nullable: true })
  finishedAt!: Date | null;

  @OneToMany(
    () => WorkoutSessionExerciseTypeormEntity,
    (exercise) => exercise.session,
    { cascade: true, eager: true },
  )
  exercises!: WorkoutSessionExerciseTypeormEntity[];
}
