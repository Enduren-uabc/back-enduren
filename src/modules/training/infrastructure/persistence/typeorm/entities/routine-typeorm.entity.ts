import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { RoutineDayTypeormEntity } from './routine-day-typeorm.entity';

@Entity('routines')
export class RoutineTypeormEntity {
  @PrimaryColumn('uuid')
  id!: string;

  @Column('varchar')
  name!: string;

  @Column('uuid', { name: 'user_id' })
  userId!: string;

  @Column('boolean', { name: 'is_active', default: false })
  isActive!: boolean;

  @Column('varchar', { name: 'training_strategy_key', nullable: true })
  trainingStrategyKey!: string | null;

  @Column('varchar', { name: 'target_audience', default: 'self' })
  targetAudience!: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @OneToMany(() => RoutineDayTypeormEntity, (day) => day.routine, {
    cascade: true,
    eager: true,
    orphanedRowAction: 'delete',
  })
  days!: RoutineDayTypeormEntity[];
}
