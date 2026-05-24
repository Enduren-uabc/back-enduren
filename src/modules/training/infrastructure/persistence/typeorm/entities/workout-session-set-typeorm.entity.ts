import { Entity, PrimaryColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { WorkoutSessionExerciseTypeormEntity } from './workout-session-exercise-typeorm.entity';

@Entity('workout_session_sets')
export class WorkoutSessionSetTypeormEntity {
  @PrimaryColumn('uuid')
  id!: string;

  @Column('uuid', { name: 'session_exercise_id' })
  sessionExerciseId!: string;

  @Column('int', { name: 'set_number' })
  setNumber!: number;

  @Column('int', { name: 'reps_performed', nullable: true })
  repsPerformed!: number | null;

  @Column('float', { name: 'weight_used', nullable: true })
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
  @JoinColumn({ name: 'session_exercise_id' })
  sessionExercise!: WorkoutSessionExerciseTypeormEntity;
}
