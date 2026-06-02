import { Entity, PrimaryColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { ExerciseTypeormEntity } from './exercise-typeorm.entity';

@Entity('exercise_sets')
export class ExerciseSetTypeormEntity {
  @PrimaryColumn('uuid')
  id!: string;

  @Column('uuid', { name: 'exercise_id' })
  exerciseId!: string;

  @Column('int', { name: 'set_number' })
  setNumber!: number;

  @Column('int')
  reps!: number;

  @Column('float')
  weight!: number;

  @Column('int', { name: 'rest_seconds', nullable: true })
  restSeconds!: number | null;

  @ManyToOne(() => ExerciseTypeormEntity, (exercise) => exercise.sets, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'exercise_id' })
  exercise!: ExerciseTypeormEntity;
}
