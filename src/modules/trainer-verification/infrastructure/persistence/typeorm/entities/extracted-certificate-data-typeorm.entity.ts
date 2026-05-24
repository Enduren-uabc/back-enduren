import { Entity, Column, PrimaryColumn, ManyToOne, JoinColumn } from 'typeorm';
import { TrainerVerificationTypeormEntity } from './trainer-verification-typeorm.entity';

@Entity('extracted_certificate_data')
export class ExtractedCertificateDataTypeormEntity {
  @PrimaryColumn('uuid')
  id!: string;

  @Column({ name: 'verification_id', type: 'uuid' })
  verificationId!: string;

  @ManyToOne(() => TrainerVerificationTypeormEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'verification_id' })
  verification!: TrainerVerificationTypeormEntity;

  @Column({ name: 'full_name', type: 'varchar', length: 255 })
  fullName!: string;

  @Column({ name: 'certificate_name', type: 'varchar', length: 255 })
  certificateName!: string;

  @Column({ name: 'issuing_organization', type: 'varchar', length: 255 })
  issuingOrganization!: string;

  @Column({ name: 'issue_date', type: 'date', nullable: true })
  issueDate!: Date | null;

  @Column({ name: 'expiration_date', type: 'date', nullable: true })
  expirationDate!: Date | null;

  @Column({ name: 'folio_number', type: 'varchar', length: 100, nullable: true })
  folioNumber!: string | null;

  @Column({ name: 'qr_url', type: 'varchar', length: 500, nullable: true })
  qrUrl!: string | null;

  @Column({ name: 'ocr_confidence', type: 'float' })
  ocrConfidence!: number;

  @Column({ name: 'created_at', type: 'timestamp' })
  createdAt!: Date;
}
