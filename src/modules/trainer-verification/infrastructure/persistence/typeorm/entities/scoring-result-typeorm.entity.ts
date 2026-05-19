import { Entity, Column, PrimaryColumn, ManyToOne, JoinColumn } from 'typeorm';
import { TrainerVerificationTypeormEntity } from './trainer-verification-typeorm.entity';

@Entity('scoring_results')
export class ScoringResultTypeormEntity {
  @PrimaryColumn('uuid')
  id: string;

  @Column({ name: 'verification_id', type: 'uuid' })
  verificationId: string;

  @ManyToOne(() => TrainerVerificationTypeormEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'verification_id' })
  verification: TrainerVerificationTypeormEntity;

  @Column({ name: 'risk_score', type: 'integer' })
  riskScore: number;

  @Column({ name: 'risk_level', type: 'varchar', length: 20 })
  riskLevel: string;

  @Column({ name: 'recommended_action', type: 'varchar', length: 30 })
  recommendedAction: string;

  @Column({ name: 'summary', type: 'text' })
  summary: string;

  @Column({ name: 'positive_signals', type: 'json' })
  positiveSignals: string[];

  @Column({ name: 'alerts', type: 'json' })
  alerts: Array<{ code: string; severity: string; message: string }>;

  @Column({ name: 'overrides', type: 'json' })
  overrides: string[];

  @Column({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;
}
