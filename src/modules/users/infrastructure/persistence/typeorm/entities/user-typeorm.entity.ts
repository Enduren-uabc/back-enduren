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

  @Column('varchar')
  passwordHash!: string;

  @Column('varchar', { default: 'user' })
  role!: string;

  @Column('boolean', { default: false })
  emailVerified!: boolean;

  @Column('varchar', { default: 'active' })
  status!: string;

  @Column('int', { default: 0 })
  failedLoginAttempts!: number;

  @Column('timestamp', { nullable: true })
  lockedUntil!: Date | null;

  @Column('varchar', { unique: true, nullable: true })
  trainerCode!: string | null;

  @Column('varchar', { nullable: true })
  authProvider!: string | null;

  @Column('varchar', { nullable: true })
  socialId!: string | null;

  @Column('boolean', { default: false })
  privacyAccepted!: boolean;

  @Column('varchar', { nullable: true })
  avatarUrl!: string | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
