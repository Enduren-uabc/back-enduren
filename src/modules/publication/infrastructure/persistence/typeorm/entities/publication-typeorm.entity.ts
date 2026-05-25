import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('publications')
export class PublicationTypeormEntity {
  @PrimaryColumn('uuid')
  id!: string;

  @Index()
  @Column('uuid', { name: 'author_user_id' })
  authorUserId!: string;

  @Column('varchar', { length: 120 })
  title!: string;

  @Column('varchar', { length: 2000 })
  content!: string;

  @Column('text', { array: true, default: '{}', name: 'media_urls' })
  mediaUrls!: string[];

  @Column('uuid', { name: 'workout_session_id', nullable: true })
  workoutSessionId!: string | null;

  @Column('jsonb', { name: 'exercise_summary', nullable: true })
  exerciseSummary!: Record<string, unknown> | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
