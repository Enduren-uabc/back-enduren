import { Entity, PrimaryColumn, Column } from 'typeorm';

@Entity('exercise_catalog')
export class ExerciseCatalogTypeormEntity {
  @PrimaryColumn('uuid')
  id!: string;

  @Column('varchar')
  name!: string;

  @Column('varchar')
  category!: string;

  @Column('varchar')
  primaryMuscleGroup!: string;

  @Column('varchar')
  equipment!: string;
}
