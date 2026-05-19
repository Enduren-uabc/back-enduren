import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';
import { TrainerVerificationTypeormEntity } from './trainer-verification-typeorm.entity';

@Entity('trainer_verification_advanced_status')
export class TrainerVerificationAdvancedStatusTypeormEntity {
  @PrimaryColumn('uuid')
  id!: string;

  @Column('uuid', { name: 'trainer_verification_id', unique: true })
  trainerVerificationId!: string;

  @Column('varchar', { name: 'advanced_status', length: 40, default: 'draft' })
  advancedStatus!: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @OneToOne(
    () => TrainerVerificationTypeormEntity,
    (verification) => verification.advancedStatus,
  )
  @JoinColumn({ name: 'trainer_verification_id' })
  verification!: TrainerVerificationTypeormEntity;
}
