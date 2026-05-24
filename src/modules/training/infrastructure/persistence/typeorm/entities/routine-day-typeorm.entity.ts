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

  @Column('varchar', { name: 'day_of_week' })
  dayOfWeek!: string;

  @Column('uuid', { name: 'routine_id' })
  routineId!: string;

  @ManyToOne(() => RoutineTypeormEntity, (routine) => routine.days, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'routine_id' })
  routine!: RoutineTypeormEntity;

  @OneToMany(() => ExerciseTypeormEntity, (exercise) => exercise.routineDay, {
    cascade: true,
    eager: true,
  })
  exercises!: ExerciseTypeormEntity[];
}
