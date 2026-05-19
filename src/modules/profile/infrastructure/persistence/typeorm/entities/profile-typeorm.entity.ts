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

  @Column('uuid', { unique: true })
  userId!: string;

  @Column('varchar')
  fullName!: string;

  @Column('date')
  birthDate!: Date;

  @Column('varchar')
  gender!: string;

  @Column('numeric', { precision: 5, scale: 2 })
  weight!: number;

  @Column('numeric', { precision: 5, scale: 2 })
  height!: number;

  @Column('varchar')
  experienceLevel!: string;

  @Column('varchar')
  mainGoal!: string;

  @Column('integer', { default: 3 })
  daysAvailablePerWeek!: number;

  @Column('varchar', { default: 'kg' })
  weightUnit!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
