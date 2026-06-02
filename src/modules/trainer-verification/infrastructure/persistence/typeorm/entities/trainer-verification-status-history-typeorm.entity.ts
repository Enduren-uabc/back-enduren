import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
} from 'typeorm';
import { TrainerVerificationTypeormEntity } from './trainer-verification-typeorm.entity';

@Entity('trainer_verification_status_history')
export class TrainerVerificationStatusHistoryTypeormEntity {
  @PrimaryColumn('uuid')
  id!: string;

  @Column('uuid', { name: 'trainer_verification_id' })
  trainerVerificationId!: string;

  @Column('varchar', { name: 'previous_status', length: 40, nullable: true })
  previousStatus!: string | null;

  @Column('varchar', { name: 'new_status', length: 40 })
  newStatus!: string;

  @Column('varchar', { name: 'actor_id', length: 36 })
  actorId!: string;

  @Column('varchar', { name: 'actor_type', length: 20, default: 'system' })
  actorType!: string;

  @Column('text', { nullable: true })
  reason!: string | null;

  @Column('jsonb', { nullable: true })
  metadata!: Record<string, unknown> | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @ManyToOne(
    () => TrainerVerificationTypeormEntity,
    (verification) => verification.statusHistory,
  )
  @JoinColumn({ name: 'trainer_verification_id' })
  verification!: TrainerVerificationTypeormEntity;
}
