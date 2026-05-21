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

  @Column('uuid')
  clientId!: string;

  @Column('uuid')
  trainerId!: string;

  @Column('varchar', { length: 20, default: 'pendiente' })
  status!: string;

  @Column('text', { nullable: true })
  message!: string | null;

  @Column('text', { nullable: true })
  rejectionReason!: string | null;

  @Column('timestamp', { nullable: true })
  cancelledAt!: Date | null;

  @Column('timestamp', { nullable: true })
  respondedAt!: Date | null;

  @Column('uuid', { nullable: true })
  respondedById!: string | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
