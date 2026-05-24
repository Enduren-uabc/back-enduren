import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('trainer_assigned_routines')
@Index(['clientId', 'status'])
@Index(['trainerId'])
@Index(['clientId'], { where: "status = 'active'" })
export class TrainerAssignedRoutineTypeormEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'trainer_id', type: 'uuid' })
  trainerId: string;

  @Column({ name: 'client_id', type: 'uuid' })
  clientId: string;

  @Column({ name: 'link_id', type: 'uuid' })
  linkId: string;

  @Column({ name: 'routine_id', type: 'uuid' })
  routineId: string;

  @Column({ name: 'routine_snapshot', type: 'jsonb' })
  routineSnapshot: Record<string, unknown>;

  @Column({ type: 'varchar', length: 20, default: 'active' })
  status: string;

  @Column({ name: 'assigned_at', type: 'timestamp', default: () => 'NOW()' })
  assignedAt: Date;

  @Column({ name: 'replaced_by_id', type: 'uuid', nullable: true })
  replacedById: string | null;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
