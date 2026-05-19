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
  @PrimaryColumn('uuid')
  userId!: string;

  @Index()
  @Column('varchar', { length: 120 })
  displayName!: string;

  @Index({ unique: true })
  @Column('varchar', { length: 60 })
  handle!: string;

  @Column('varchar', { length: 300, nullable: true })
  bio!: string | null;

  @Column('varchar', { length: 2048, nullable: true })
  avatarUrl!: string | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
