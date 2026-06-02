import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('social_auth_codes')
export class SocialAuthCodeTypeormEntity {
  @PrimaryColumn('uuid')
  id!: string;

  @Column('uuid', { name: 'user_id' })
  userId!: string;

  @Column('varchar')
  provider!: string;

  @Index({ unique: true })
  @Column('varchar', { length: 64 })
  code!: string;

  @Column('timestamp', { name: 'expires_at' })
  expiresAt!: Date;

  @Column('timestamp', { nullable: true, name: 'used_at' })
  usedAt!: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
