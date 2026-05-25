import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('social_profiles')
export class SocialProfileTypeormEntity {
  @PrimaryColumn('uuid', { name: 'user_id' })
  userId!: string;

  @Index()
  @Column('varchar', { length: 120, name: 'display_name' })
  displayName!: string;

  @Index({ unique: true })
  @Column('varchar', { length: 60 })
  handle!: string;

  @Column('varchar', { length: 300, nullable: true })
  bio!: string | null;

  @Column('varchar', { length: 2048, nullable: true, name: 'avatar_url' })
  avatarUrl!: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
