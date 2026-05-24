import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('user_profiles')
export class ProfileTypeormEntity {
  @PrimaryColumn('uuid')
  id!: string;

  @Column('uuid', { unique: true, name: 'user_id' })
  userId!: string;

  @Column('varchar', { name: 'full_name' })
  fullName!: string;

  @Column('date', { name: 'birth_date' })
  birthDate!: Date;

  @Column('varchar')
  gender!: string;

  @Column('numeric', { precision: 5, scale: 2 })
  weight!: number;

  @Column('numeric', { precision: 5, scale: 2 })
  height!: number;

  @Column('varchar', { name: 'experience_level' })
  experienceLevel!: string;

  @Column('varchar', { name: 'main_goal' })
  mainGoal!: string;

  @Column('integer', { default: 3, name: 'days_available_per_week' })
  daysAvailablePerWeek!: number;

  @Column('varchar', { default: 'kg', name: 'weight_unit' })
  weightUnit!: string;

  @Column('varchar', { nullable: true, name: 'default_training_strategy_key' })
  defaultTrainingStrategyKey!: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
