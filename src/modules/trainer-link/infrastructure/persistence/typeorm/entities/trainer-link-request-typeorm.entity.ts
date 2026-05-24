import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('trainer_link_requests')
@Index('idx_link_requests_client_status', ['clientId', 'status'])
@Index('idx_link_requests_trainer_status', ['trainerId', 'status'])
@Index('idx_link_requests_created_at', ['createdAt'])
export class TrainerLinkRequestTypeormEntity {
  @PrimaryColumn('uuid')
  id!: string;

  @Column('uuid', { name: 'client_id' })
  clientId!: string;

  @Column('uuid', { name: 'trainer_id' })
  trainerId!: string;

  @Column('varchar', { length: 20, default: 'pendiente' })
  status!: string;

  @Column('text', { nullable: true })
  message!: string | null;

  @Column('text', { name: 'rejection_reason', nullable: true })
  rejectionReason!: string | null;

  @Column('timestamp', { name: 'cancelled_at', nullable: true })
  cancelledAt!: Date | null;

  @Column('timestamp', { name: 'responded_at', nullable: true })
  respondedAt!: Date | null;

  @Column('uuid', { name: 'responded_by_id', nullable: true })
  respondedById!: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
