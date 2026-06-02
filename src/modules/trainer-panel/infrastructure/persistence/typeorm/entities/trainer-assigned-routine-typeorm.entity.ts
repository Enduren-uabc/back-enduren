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

  @Column({ type: 'uuid', name: 'trainer_id' })
  trainerId: string;

  @Column({ type: 'uuid', name: 'client_id' })
  clientId: string;

  @Column({ type: 'uuid', name: 'link_id' })
  linkId: string;

  @Column({ type: 'uuid', name: 'routine_id' })
  routineId: string;

  @Column({ type: 'jsonb', name: 'routine_snapshot' })
  routineSnapshot: Record<string, unknown>;

  @Column({ type: 'varchar', length: 20, default: 'active' })
  status: string;

  @Column({ type: 'timestamp', default: () => 'NOW()', name: 'assigned_at' })
  assignedAt: Date;

  @Column({ type: 'uuid', nullable: true, name: 'replaced_by_id' })
  replacedById: string | null;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
