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

  @Column('int', { name: 'exercise_order' })
  order!: number;

  @Column('uuid', { name: 'routine_day_id' })
  routineDayId!: string;

  @ManyToOne(() => RoutineDayTypeormEntity, (day) => day.exercises, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'routine_day_id' })
  routineDay!: RoutineDayTypeormEntity;

  @OneToMany(() => ExerciseSetTypeormEntity, (set) => set.exercise, {
    cascade: true,
    eager: true,
  })
  sets!: ExerciseSetTypeormEntity[];
}
