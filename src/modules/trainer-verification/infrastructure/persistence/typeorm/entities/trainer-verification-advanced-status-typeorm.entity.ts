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

  @Column('uuid', { unique: true })
  trainerVerificationId!: string;

  @Column('varchar', { length: 40, default: 'draft' })
  advancedStatus!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @OneToOne(
    () => TrainerVerificationTypeormEntity,
    (verification) => verification.advancedStatus,
  )
  @JoinColumn({ name: 'trainerVerificationId' })
  verification!: TrainerVerificationTypeormEntity;
}
