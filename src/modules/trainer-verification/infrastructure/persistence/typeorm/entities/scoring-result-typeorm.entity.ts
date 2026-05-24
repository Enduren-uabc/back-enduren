import { Entity, Column, PrimaryColumn, ManyToOne, JoinColumn } from 'typeorm';
import { TrainerVerificationTypeormEntity } from './trainer-verification-typeorm.entity';

@Entity('scoring_results')
export class ScoringResultTypeormEntity {
  @PrimaryColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  verificationId: string;

  @ManyToOne(() => TrainerVerificationTypeormEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'verificationId' })
  verification: TrainerVerificationTypeormEntity;

  @Column({ type: 'integer' })
  riskScore: number;

  @Column({ type: 'varchar', length: 20 })
  riskLevel: string;

  @Column({ type: 'varchar', length: 30 })
  recommendedAction: string;

  @Column({ type: 'text' })
  summary: string;

  @Column({ type: 'json' })
  positiveSignals: string[];

  @Column({ type: 'json' })
  alerts: Array<{ code: string; severity: string; message: string }>;

  @Column({ type: 'json' })
  overrides: string[];

  @Column({ type: 'timestamp' })
  createdAt: Date;
}
