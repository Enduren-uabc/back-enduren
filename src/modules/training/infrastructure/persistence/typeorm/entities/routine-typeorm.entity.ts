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

  @Column('uuid')
  userId!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @OneToMany(() => RoutineDayTypeormEntity, (day) => day.routine, {
    cascade: true,
    eager: true,
  })
  days!: RoutineDayTypeormEntity[];
}
