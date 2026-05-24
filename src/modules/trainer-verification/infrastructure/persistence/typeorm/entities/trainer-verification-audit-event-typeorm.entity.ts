import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
} from 'typeorm';
import { TrainerVerificationTypeormEntity } from './trainer-verification-typeorm.entity';

@Entity('trainer_verification_audit_events')
export class TrainerVerificationAuditEventTypeormEntity {
  @PrimaryColumn('uuid')
  id!: string;

  @Column('uuid')
  trainerVerificationId!: string;

  @Column('varchar', { length: 40 })
  eventType!: string;

  @Column('varchar', { length: 36 })
  actorId!: string;

  @Column('varchar', { length: 20, default: 'system' })
  actorType!: string;

  @Column('text')
  description!: string;

  @Column('jsonb', { nullable: true })
  metadata!: Record<string, unknown> | null;

  @CreateDateColumn()
  createdAt!: Date;

  @ManyToOne(
    () => TrainerVerificationTypeormEntity,
    (verification) => verification.auditEvents,
  )
  @JoinColumn({ name: 'trainerVerificationId' })
  verification!: TrainerVerificationTypeormEntity;
}
