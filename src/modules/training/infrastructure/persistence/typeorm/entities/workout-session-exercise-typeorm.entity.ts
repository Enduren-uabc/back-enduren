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

@Entity('workout_session_exercises')
export class WorkoutSessionExerciseTypeormEntity {
  @PrimaryColumn('uuid')
  id!: string;

  @Column('uuid')
  sessionId!: string;

  @Column('uuid')
  exerciseId!: string;

  @Column('varchar')
  exerciseName!: string;

  @Column('int')
  orderIndex!: number;

  @Column('int')
  sets!: number;

  @Column('int')
  repsPerSet!: number;

  @Column('float')
  weight!: number;

  @ManyToOne(
    () => WorkoutSessionTypeormEntity,
    (session) => session.exercises,
    { onDelete: 'CASCADE' },
  )
  @JoinColumn({ name: 'sessionId' })
  session!: WorkoutSessionTypeormEntity;

  @OneToMany(
    () => WorkoutSessionSetTypeormEntity,
    (set) => set.sessionExercise,
    { cascade: true, eager: true },
  )
  workoutSets!: WorkoutSessionSetTypeormEntity[];
}
