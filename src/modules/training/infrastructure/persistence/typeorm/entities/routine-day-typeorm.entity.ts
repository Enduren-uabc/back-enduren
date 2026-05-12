import {
  Entity,
  PrimaryColumn,
  Column,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { RoutineTypeormEntity } from './routine-typeorm.entity';
import { ExerciseTypeormEntity } from './exercise-typeorm.entity';

@Entity('routine_days')
export class RoutineDayTypeormEntity {
  @PrimaryColumn('uuid')
  id!: string;

  @Column('varchar')
  dayOfWeek!: string;

  @Column('uuid')
  routineId!: string;

  @ManyToOne(() => RoutineTypeormEntity, (routine) => routine.days, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'routineId' })
  routine!: RoutineTypeormEntity;

  @OneToMany(() => ExerciseTypeormEntity, (exercise) => exercise.routineDay, {
    cascade: true,
    eager: true,
    orphanedRowAction: 'delete',
  })
  exercises!: ExerciseTypeormEntity[];
}
