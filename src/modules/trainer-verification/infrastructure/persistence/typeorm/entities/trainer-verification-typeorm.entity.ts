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
import { ScoringResultTypeormEntity } from './scoring-result-typeorm.entity';

@Entity('trainer_verifications')
export class TrainerVerificationTypeormEntity {
  @PrimaryColumn('uuid')
  id!: string;

  @Column('uuid', { unique: true })
  userId!: string;

  @Column('varchar', { length: 20, default: 'pending' })
  verificationStatus!: string;

  @Column('integer')
  yearsOfExperience!: number;

  @Column('text')
  shortBio!: string;

  @Column('varchar', { length: 100 })
  idDocumentNumber!: string;

  @Column('text', { nullable: true })
  rejectionReason!: string | null;

  @Column('uuid', { nullable: true })
  verifiedBy!: string | null;

  @Column({ nullable: true })
  verifiedAt!: Date;

  @Column({ type: 'uuid', nullable: true })
  assignedReviewerId!: string | null;

  @Column('varchar', { length: 20, default: 'legacy' })
  flowMode!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
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

  @OneToMany(
    () => ScoringResultTypeormEntity,
    (scoring) => scoring.verification,
  )
  scoringResults!: ScoringResultTypeormEntity[];
}
