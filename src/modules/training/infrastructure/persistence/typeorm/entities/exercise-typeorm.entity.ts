import {
  Entity,
  PrimaryColumn,
  Column,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { RoutineDayTypeormEntity } from './routine-day-typeorm.entity';
import { ExerciseSetTypeormEntity } from './exercise-set-typeorm.entity';

@Entity('exercises')
export class ExerciseTypeormEntity {
  @PrimaryColumn('uuid')
  id!: string;

  @Column('varchar')
  name!: string;

  @Column('int')
  order!: number;

  @Column('uuid')
  routineDayId!: string;

  @ManyToOne(() => RoutineDayTypeormEntity, (day) => day.exercises, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'routineDayId' })
  routineDay!: RoutineDayTypeormEntity;

  @OneToMany(() => ExerciseSetTypeormEntity, (set) => set.exercise, {
    cascade: true,
    eager: true,
    orphanedRowAction: 'delete',
  })
  sets!: ExerciseSetTypeormEntity[];
}
