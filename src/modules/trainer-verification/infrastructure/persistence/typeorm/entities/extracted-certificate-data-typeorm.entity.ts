import { Entity, Column, PrimaryColumn, ManyToOne, JoinColumn } from 'typeorm';
import { TrainerVerificationTypeormEntity } from './trainer-verification-typeorm.entity';

@Entity('extracted_certificate_data')
export class ExtractedCertificateDataTypeormEntity {
  @PrimaryColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  verificationId!: string;

  @ManyToOne(() => TrainerVerificationTypeormEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'verificationId' })
  verification!: TrainerVerificationTypeormEntity;

  @Column({ type: 'varchar', length: 255 })
  fullName!: string;

  @Column({ type: 'varchar', length: 255 })
  certificateName!: string;

  @Column({ type: 'varchar', length: 255 })
  issuingOrganization!: string;

  @Column({ type: 'date', nullable: true })
  issueDate!: Date | null;

  @Column({ type: 'date', nullable: true })
  expirationDate!: Date | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  folioNumber!: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  qrUrl!: string | null;

  @Column({ type: 'float' })
  ocrConfidence!: number;

  @Column({ type: 'timestamp' })
  createdAt!: Date;
}
