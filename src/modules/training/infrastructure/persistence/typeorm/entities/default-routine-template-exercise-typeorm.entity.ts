import { Entity, PrimaryColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { DefaultRoutineTemplateTypeormEntity } from './default-routine-template-typeorm.entity';

@Entity('default_routine_template_exercises')
export class DefaultRoutineTemplateExerciseTypeormEntity {
  @PrimaryColumn('uuid')
  id!: string;

  @Column('uuid', { name: 'template_id' })
  templateId!: string;

  @Column('uuid', { name: 'exercise_catalog_id' })
  exerciseCatalogId!: string;

  @Column('varchar', { name: 'exercise_name', length: 100 })
  exerciseName!: string;

  @Column('int', { name: 'exercise_order' })
  exerciseOrder!: number;

  @Column('int', { name: 'sets_count' })
  setsCount!: number;

  @Column('int', { name: 'initial_reps' })
  initialReps!: number;

  @Column('decimal', { name: 'initial_weight', precision: 5, scale: 2 })
  initialWeight!: number;

  @Column('timestamp', { name: 'created_at', default: () => 'NOW()' })
  createdAt!: Date;

  @ManyToOne(() => DefaultRoutineTemplateTypeormEntity, (t) => t.exercises, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'template_id' })
  template!: DefaultRoutineTemplateTypeormEntity;
}
