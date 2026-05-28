import { Entity, PrimaryColumn, Column, OneToMany, JoinColumn } from 'typeorm';
import { DefaultRoutineTemplateExerciseTypeormEntity } from './default-routine-template-exercise-typeorm.entity';

@Entity('default_routine_templates')
export class DefaultRoutineTemplateTypeormEntity {
  @PrimaryColumn('uuid')
  id!: string;

  @Column('varchar', { name: 'experience_level', length: 20 })
  experienceLevel!: string;

  @Column('varchar', { name: 'split_key', length: 20, nullable: true })
  splitKey!: string | null;

  @Column('varchar', { length: 100 })
  name!: string;

  @Column('varchar', { name: 'day_of_week', length: 10 })
  dayOfWeek!: string;

  @Column('int', { name: 'display_order' })
  displayOrder!: number;

  @Column('timestamp', { name: 'created_at', default: () => 'NOW()' })
  createdAt!: Date;

  @Column('timestamp', { name: 'updated_at', default: () => 'NOW()' })
  updatedAt!: Date;

  @OneToMany(
    () => DefaultRoutineTemplateExerciseTypeormEntity,
    (ex) => ex.template,
    { cascade: true, eager: true },
  )
  @JoinColumn({ name: 'id', referencedColumnName: 'templateId' })
  exercises!: DefaultRoutineTemplateExerciseTypeormEntity[];
}
