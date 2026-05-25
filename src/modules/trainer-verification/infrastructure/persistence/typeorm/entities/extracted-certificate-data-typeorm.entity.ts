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

  @Column({
    name: 'folio_number',
    type: 'varchar',
    length: 100,
    nullable: true,
  })
  folioNumber!: string | null;

  @Column({ name: 'qr_url', type: 'varchar', length: 500, nullable: true })
  qrUrl!: string | null;

  @Column({ name: 'ocr_confidence', type: 'float' })
  ocrConfidence!: number;

  @Column({ name: 'curp', type: 'varchar', length: 18, nullable: true })
  curp!: string | null;

  @Column({
    name: 'document_type',
    type: 'varchar',
    length: 50,
    nullable: true,
  })
  documentType!: string | null;

  @Column({
    name: 'certifying_institution',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  certifyingInstitution!: string | null;

  @Column({
    name: 'competency_standard_code',
    type: 'varchar',
    length: 50,
    nullable: true,
  })
  competencyStandardCode!: string | null;

  @Column({
    name: 'competency_standard_name',
    type: 'varchar',
    length: 500,
    nullable: true,
  })
  competencyStandardName!: string | null;

  @Column({
    name: 'has_veracity_code',
    type: 'boolean',
    nullable: true,
  })
  hasVeracityCode!: boolean | null;

  @Column({
    name: 'veracity_code',
    type: 'varchar',
    length: 100,
    nullable: true,
  })
  veracityCode!: string | null;

  @Column({ name: 'created_at', type: 'timestamp' })
  createdAt!: Date;
}
