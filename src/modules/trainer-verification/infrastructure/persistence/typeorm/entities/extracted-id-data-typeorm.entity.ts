import { Entity, Column, PrimaryColumn, ManyToOne, JoinColumn } from 'typeorm';
import { TrainerVerificationTypeormEntity } from './trainer-verification-typeorm.entity';

@Entity('extracted_id_data')
export class ExtractedIdDataTypeormEntity {
  @PrimaryColumn('uuid')
  id!: string;

  @Column({ name: 'verification_id', type: 'uuid' })
  verificationId!: string;

  @ManyToOne(() => TrainerVerificationTypeormEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'verification_id' })
  verification!: TrainerVerificationTypeormEntity;

  @Column({ name: 'full_name', type: 'varchar', length: 255 })
  fullName!: string;

  @Column({ name: 'document_type', type: 'varchar', length: 50 })
  documentType!: string;

  @Column({
    name: 'issuing_country',
    type: 'varchar',
    length: 100,
    nullable: true,
  })
  issuingCountry!: string | null;

  @Column({ name: 'birth_date', type: 'date', nullable: true })
  birthDate!: Date | null;

  @Column({ name: 'expiration_date', type: 'date', nullable: true })
  expirationDate!: Date | null;

  @Column({
    name: 'document_identifier',
    type: 'varchar',
    length: 100,
    nullable: true,
  })
  documentIdentifier!: string | null;

  @Column({ name: 'ocr_confidence', type: 'float' })
  ocrConfidence!: number;

  @Column({ name: 'curp', type: 'varchar', length: 18, nullable: true })
  curp!: string | null;

  @Column({ name: 'created_at', type: 'timestamp' })
  createdAt!: Date;
}
