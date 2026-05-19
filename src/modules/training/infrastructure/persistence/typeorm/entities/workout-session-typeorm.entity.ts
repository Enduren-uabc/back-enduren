import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  OneToMany,
  type ColumnType,
} from 'typeorm';
import { WorkoutSessionExerciseTypeormEntity } from './workout-session-exercise-typeorm.entity';

const dateTimeColumnType: ColumnType =
  process.env.NODE_ENV === 'test' ? 'datetime' : 'timestamp';

@Entity('workout_sessions')
export class WorkoutSessionTypeormEntity {
  @PrimaryColumn('uuid')
  id!: string;

  @Column('uuid')
  userId!: string;

  @Column('uuid')
  routineId!: string;

  @Column('varchar', { default: 'monday' })
  dayOfWeek!: string;

  @Column('varchar')
  status!: string;

  @Column('int', { default: 0 })
  currentExerciseIndex!: number;

  @CreateDateColumn()
  startedAt!: Date;

  @Column({ type: dateTimeColumnType, nullable: true })
  finishedAt!: Date | null;

  @OneToMany(
    () => WorkoutSessionExerciseTypeormEntity,
    (exercise) => exercise.session,
    { cascade: true, eager: true },
  )
  exercises!: WorkoutSessionExerciseTypeormEntity[];
}
