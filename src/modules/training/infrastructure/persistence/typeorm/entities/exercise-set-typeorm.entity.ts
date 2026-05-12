import { Entity, PrimaryColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { ExerciseTypeormEntity } from './exercise-typeorm.entity';

@Entity('exercise_sets')
export class ExerciseSetTypeormEntity {
  @PrimaryColumn('uuid')
  id!: string;

  @Column('uuid')
  exerciseId!: string;

  @Column('int')
  setNumber!: number;

  @Column('int')
  reps!: number;

  @Column('float')
  weight!: number;

  @Column('int', { nullable: true })
  restSeconds!: number | null;

  @ManyToOne(() => ExerciseTypeormEntity, (exercise) => exercise.sets, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'exerciseId' })
  exercise!: ExerciseTypeormEntity;
}
