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

  @Column({ type: 'uuid' })
  trainerId: string;

  @Column({ type: 'uuid' })
  clientId: string;

  @Column({ type: 'uuid' })
  linkId: string;

  @Column({ type: 'uuid' })
  routineId: string;

  @Column({ type: 'jsonb' })
  routineSnapshot: Record<string, unknown>;

  @Column({ type: 'varchar', length: 20, default: 'active' })
  status: string;

  @Column({ type: 'timestamp', default: () => 'NOW()' })
  assignedAt: Date;

  @Column({ type: 'uuid', nullable: true })
  replacedById: string | null;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
