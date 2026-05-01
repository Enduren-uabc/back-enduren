import { Entity, PrimaryColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { RoutineDayTypeormEntity } from './routine-day-typeorm.entity';

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
}
