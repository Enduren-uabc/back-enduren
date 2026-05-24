import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
} from 'typeorm';

@Entity('training_reminders')
export class TrainingReminderTypeormEntity {
  @PrimaryColumn('uuid')
  id!: string;

  @Column('uuid', { name: 'user_id' })
  userId!: string;

  @Column('uuid', { name: 'routine_id' })
  routineId!: string;

  @Column('varchar', { name: 'routine_name' })
  routineName!: string;

  @Column('varchar', { name: 'day_of_week' })
  dayOfWeek!: string;

  @Column('varchar', { length: 5 })
  time!: string;

  @Column('varchar', { length: 50, default: 'America/Mexico_City' })
  timezone!: string;

  @Column('varchar', { length: 20, default: 'activo' })
  status!: string;

  @Column('timestamp', { name: 'next_activation_at', nullable: true })
  nextActivationAt!: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt!: Date | null;
}
