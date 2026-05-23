import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('email_verification_tokens')
export class EmailVerificationTokenTypeormEntity {
  @PrimaryColumn('uuid')
  id!: string;

  @Column('uuid')
  userId!: string;

  @Index({ unique: true })
  @Column('varchar', { length: 6 })
  token!: string;

  @Column('timestamp')
  expiresAt!: Date;

  @Column('timestamp', { nullable: true })
  usedAt!: Date | null;

  @CreateDateColumn()
  createdAt!: Date;
}
