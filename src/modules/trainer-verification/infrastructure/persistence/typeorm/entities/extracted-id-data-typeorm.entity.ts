import { Entity, Column, PrimaryColumn, ManyToOne, JoinColumn } from 'typeorm';
import { TrainerVerificationTypeormEntity } from './trainer-verification-typeorm.entity';

@Entity('extracted_id_data')
export class ExtractedIdDataTypeormEntity {
  @PrimaryColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  verificationId!: string;

  @ManyToOne(() => TrainerVerificationTypeormEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'verificationId' })
  verification!: TrainerVerificationTypeormEntity;

  @Column({ type: 'varchar', length: 255 })
  fullName!: string;

  @Column({ type: 'varchar', length: 50 })
  documentType!: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  issuingCountry!: string | null;

  @Column({ type: 'date', nullable: true })
  birthDate!: Date | null;

  @Column({ type: 'date', nullable: true })
  expirationDate!: Date | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  documentIdentifier!: string | null;

  @Column({ type: 'float' })
  ocrConfidence!: number;

  @Column({ type: 'timestamp' })
  createdAt!: Date;
}
