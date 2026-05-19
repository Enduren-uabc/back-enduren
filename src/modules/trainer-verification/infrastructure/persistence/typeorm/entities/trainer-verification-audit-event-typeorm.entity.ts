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

  @Column('uuid', { name: 'trainer_verification_id' })
  trainerVerificationId!: string;

  @Column('varchar', { name: 'event_type', length: 40 })
  eventType!: string;

  @Column('varchar', { name: 'actor_id', length: 36 })
  actorId!: string;

  @Column('varchar', { name: 'actor_type', length: 20, default: 'system' })
  actorType!: string;

  @Column('text', { name: 'description' })
  description!: string;

  @Column('jsonb', { name: 'metadata', nullable: true })
  metadata!: Record<string, unknown> | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @ManyToOne(
    () => TrainerVerificationTypeormEntity,
    (verification) => verification.auditEvents,
  )
  @JoinColumn({ name: 'trainer_verification_id' })
  verification!: TrainerVerificationTypeormEntity;
}
