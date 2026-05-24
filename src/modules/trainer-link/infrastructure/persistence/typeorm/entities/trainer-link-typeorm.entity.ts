import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('trainer_links')
@Index('idx_links_client_status', ['clientId', 'status'])
@Index('idx_links_trainer_status', ['trainerId', 'status'])
export class TrainerLinkTypeormEntity {
  @PrimaryColumn('uuid')
  id!: string;

  @Column('uuid', { name: 'client_id' })
  clientId!: string;

  @Column('uuid', { name: 'trainer_id' })
  trainerId!: string;

  @Column('uuid', { name: 'link_request_id' })
  linkRequestId!: string;

  @Column('varchar', { length: 20, default: 'active' })
  status!: string;

  @Column('timestamp', { name: 'activated_at', default: () => 'NOW()' })
  activatedAt!: Date;

  @Column('timestamp', { name: 'deactivated_at', nullable: true })
  deactivatedAt!: Date | null;

  @Column('text', { name: 'deactivation_reason', nullable: true })
  deactivationReason!: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
