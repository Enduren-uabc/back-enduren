import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('password_reset_tokens')
export class PasswordResetTokenTypeormEntity {
  @PrimaryColumn('uuid')
  id!: string;

  @Column('uuid', { name: 'user_id' })
  userId!: string;

  @Index({ unique: true })
  @Column('varchar', { length: 6 })
  token!: string;

  @Column('timestamp', { name: 'expires_at' })
  expiresAt!: Date;

  @Column('timestamp', { nullable: true, name: 'used_at' })
  usedAt!: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
