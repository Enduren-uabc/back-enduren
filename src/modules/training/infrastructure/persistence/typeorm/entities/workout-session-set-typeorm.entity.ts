import { Entity, PrimaryColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { WorkoutSessionExerciseTypeormEntity } from './workout-session-exercise-typeorm.entity';

@Entity('workout_session_sets')
export class WorkoutSessionSetTypeormEntity {
  @PrimaryColumn('uuid')
  id!: string;

  @Column('uuid')
  sessionExerciseId!: string;

  @Column('int')
  setNumber!: number;

  @Column('int', { nullable: true })
  repsPerformed!: number | null;

  @Column('float', { nullable: true })
  weightUsed!: number | null;

  @Column('int', { name: 'target_reps', nullable: true })
  targetReps!: number | null;

  @Column('float', { name: 'target_weight', nullable: true })
  targetWeight!: number | null;

  @Column('boolean', { default: false })
  completed!: boolean;

  @ManyToOne(
    () => WorkoutSessionExerciseTypeormEntity,
    (exercise) => exercise.workoutSets,
    { onDelete: 'CASCADE' },
  )
  @JoinColumn({ name: 'sessionExerciseId' })
  sessionExercise!: WorkoutSessionExerciseTypeormEntity;
}
