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

  @Column('uuid')
  clientId!: string;

  @Column('uuid')
  trainerId!: string;

  @Column('uuid')
  linkRequestId!: string;

  @Column('varchar', { length: 20, default: 'active' })
  status!: string;

  @Column('timestamp', { default: () => 'NOW()' })
  activatedAt!: Date;

  @Column('timestamp', { nullable: true })
  deactivatedAt!: Date | null;

  @Column('text', { nullable: true })
  deactivationReason!: string | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
