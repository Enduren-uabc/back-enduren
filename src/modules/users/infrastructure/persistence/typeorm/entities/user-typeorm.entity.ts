import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('users')
export class UserTypeormEntity {
  @PrimaryColumn('uuid')
  id!: string;

  @Column('varchar', { unique: true })
  email!: string;

  @Column('varchar', { unique: true })
  username!: string;

  @Column('varchar', { name: 'password_hash' })
  passwordHash!: string;

  @Column('varchar', { default: 'user' })
  role!: string;

  @Column('boolean', { default: false, name: 'email_verified' })
  emailVerified!: boolean;

  @Column('varchar', { default: 'active' })
  status!: string;

  @Column('int', { default: 0, name: 'failed_login_attempts' })
  failedLoginAttempts!: number;

  @Column('timestamp', { nullable: true, name: 'locked_until' })
  lockedUntil!: Date | null;

  @Column('varchar', { unique: true, nullable: true, name: 'trainer_code' })
  trainerCode!: string | null;

  @Column('varchar', { nullable: true, name: 'auth_provider' })
  authProvider!: string | null;

  @Column('varchar', { nullable: true, name: 'social_id' })
  socialId!: string | null;

  @Column('boolean', { default: false, name: 'privacy_accepted' })
  privacyAccepted!: boolean;

  @Column('varchar', { nullable: true, name: 'avatar_url' })
  avatarUrl!: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
