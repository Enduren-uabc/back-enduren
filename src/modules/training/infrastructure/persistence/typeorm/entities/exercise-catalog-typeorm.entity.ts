import { Entity, PrimaryColumn, Column } from 'typeorm';

@Entity('exercise_catalog')
export class ExerciseCatalogTypeormEntity {
  @PrimaryColumn('uuid')
  id!: string;

  @Column('varchar')
  name!: string;

  @Column('varchar')
  category!: string;

  @Column('varchar', { name: 'primary_muscle_group' })
  primaryMuscleGroup!: string;

  @Column('varchar')
  equipment!: string;

  @Column('varchar', { name: 'video_url', nullable: true })
  videoUrl!: string | null;

  @Column('varchar', { name: 'image_url', nullable: true })
  imageUrl!: string | null;
}
