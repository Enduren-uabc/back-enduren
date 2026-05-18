import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';
import { TrainerCertificateTypeormEntity } from './trainer-certificate-typeorm.entity';
import { TrainerIdDocumentTypeormEntity } from './trainer-id-document-typeorm.entity';
import { TrainerVerificationSpecialtyTypeormEntity } from './trainer-verification-specialty-typeorm.entity';

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
}
