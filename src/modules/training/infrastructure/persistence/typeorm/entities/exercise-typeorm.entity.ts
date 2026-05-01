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

  @Column('int', { nullable: true })
  sets!: number | null;

  @Column('int', { nullable: true })
  repsPerSet!: number | null;

  @Column('float', { nullable: true })
  weight!: number | null;

  @Column('uuid')
  routineDayId!: string;

  @ManyToOne(() => RoutineDayTypeormEntity, (day) => day.exercises, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'routineDayId' })
  routineDay!: RoutineDayTypeormEntity;
}
