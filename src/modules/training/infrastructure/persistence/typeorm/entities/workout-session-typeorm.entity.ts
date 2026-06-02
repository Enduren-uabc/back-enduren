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

  @Column('uuid', { name: 'user_id' })
  userId!: string;

  @Column('uuid', { name: 'routine_id' })
  routineId!: string;

  @Column('varchar', { name: 'source_type', default: 'personal' })
  sourceType!: string;

  @Column('uuid', { name: 'assigned_routine_id', nullable: true })
  assignedRoutineId!: string | null;

  @Column('varchar', { name: 'day_of_week', default: 'monday' })
  dayOfWeek!: string;

  @Column('varchar')
  status!: string;

  @Column('int', { name: 'current_exercise_index', default: 0 })
  currentExerciseIndex!: number;

  @CreateDateColumn({ name: 'started_at' })
  startedAt!: Date;

  @Column({ name: 'finished_at', type: dateTimeColumnType, nullable: true })
  finishedAt!: Date | null;

  @OneToMany(
    () => WorkoutSessionExerciseTypeormEntity,
    (exercise) => exercise.session,
    { cascade: true, eager: true },
  )
  exercises!: WorkoutSessionExerciseTypeormEntity[];
}
