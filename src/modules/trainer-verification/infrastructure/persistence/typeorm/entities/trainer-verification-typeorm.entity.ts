import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  OneToOne,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';
import { TrainerCertificateTypeormEntity } from './trainer-certificate-typeorm.entity';
import { TrainerIdDocumentTypeormEntity } from './trainer-id-document-typeorm.entity';
import { TrainerVerificationAdvancedStatusTypeormEntity } from './trainer-verification-advanced-status-typeorm.entity';
import { TrainerVerificationAuditEventTypeormEntity } from './trainer-verification-audit-event-typeorm.entity';
import { TrainerVerificationStatusHistoryTypeormEntity } from './trainer-verification-status-history-typeorm.entity';
import { TrainerVerificationSpecialtyTypeormEntity } from './trainer-verification-specialty-typeorm.entity';
import { ExtractedCertificateDataTypeormEntity } from './extracted-certificate-data-typeorm.entity';
import { ExtractedIdDataTypeormEntity } from './extracted-id-data-typeorm.entity';

@Entity('trainer_verifications')
export class TrainerVerificationTypeormEntity {
  @PrimaryColumn('uuid')
  id!: string;

  @Column('uuid', { name: 'user_id', unique: true })
  userId!: string;

  @Column('varchar', {
    name: 'verification_status',
    length: 20,
    default: 'pending',
  })
  verificationStatus!: string;

  @Column('integer', { name: 'years_of_experience' })
  yearsOfExperience!: number;

  @Column('text', { name: 'short_bio' })
  shortBio!: string;

  @Column('varchar', { name: 'id_document_number', length: 100 })
  idDocumentNumber!: string;

  @Column('text', { name: 'rejection_reason', nullable: true })
  rejectionReason!: string | null;

  @Column('uuid', { name: 'verified_by', nullable: true })
  verifiedBy!: string | null;

  @Column({ name: 'verified_at', nullable: true })
  verifiedAt!: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @OneToMany(
    () => TrainerVerificationSpecialtyTypeormEntity,
    (specialty) => specialty.verification,
  )
  specialties!: TrainerVerificationSpecialtyTypeormEntity[];

  @OneToMany(
    () => TrainerIdDocumentTypeormEntity,
    (document) => document.verification,
  )
  idDocuments!: TrainerIdDocumentTypeormEntity[];

  @OneToMany(
    () => TrainerCertificateTypeormEntity,
    (certificate) => certificate.verification,
  )
  certificates!: TrainerCertificateTypeormEntity[];

  @OneToOne(
    () => TrainerVerificationAdvancedStatusTypeormEntity,
    (status) => status.verification,
  )
  advancedStatus!: TrainerVerificationAdvancedStatusTypeormEntity | null;

  @OneToMany(
    () => TrainerVerificationStatusHistoryTypeormEntity,
    (history) => history.verification,
  )
  statusHistory!: TrainerVerificationStatusHistoryTypeormEntity[];

  @OneToMany(
    () => TrainerVerificationAuditEventTypeormEntity,
    (event) => event.verification,
  )
  auditEvents!: TrainerVerificationAuditEventTypeormEntity[];

  @OneToMany(
    () => ExtractedCertificateDataTypeormEntity,
    (extracted) => extracted.verification,
  )
  extractedCertificateData!: ExtractedCertificateDataTypeormEntity[];

  @OneToMany(
    () => ExtractedIdDataTypeormEntity,
    (extracted) => extracted.verification,
  )
  extractedIdData!: ExtractedIdDataTypeormEntity[];
}
