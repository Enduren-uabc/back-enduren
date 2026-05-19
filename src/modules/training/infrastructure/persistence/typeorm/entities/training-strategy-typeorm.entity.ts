import { Entity, PrimaryColumn, Column } from 'typeorm';

@Entity('training_strategies')
export class TrainingStrategyTypeormEntity {
  @PrimaryColumn('varchar')
  key!: string;

  @Column('varchar')
  name!: string;

  @Column('text')
  description!: string;

  @Column('simple-json')
  rules!: Record<string, unknown>;
}
