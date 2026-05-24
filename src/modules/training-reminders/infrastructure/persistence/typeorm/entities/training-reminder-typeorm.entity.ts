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

  @Column('uuid')
  userId!: string;

  @Column('uuid')
  routineId!: string;

  @Column('varchar')
  routineName!: string;

  @Column('varchar')
  dayOfWeek!: string;

  @Column('varchar', { length: 5 })
  time!: string;

  @Column('varchar', { length: 50, default: 'America/Mexico_City' })
  timezone!: string;

  @Column('varchar', { length: 20, default: 'activo' })
  status!: string;

  @Column('timestamp', { nullable: true })
  nextActivationAt!: Date | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @DeleteDateColumn()
  deletedAt!: Date | null;
}
