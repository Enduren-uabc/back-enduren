import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { TrainerVerificationTypeormEntity } from './trainer-verification-typeorm.entity';

@Entity('trainer_certificates')
export class TrainerCertificateTypeormEntity {
  @PrimaryColumn('uuid')
  id!: string;

  @Column('uuid', { name: 'trainer_verification_id' })
  trainerVerificationId!: string;

  @Column('varchar', { length: 255 })
  name!: string;

  @Column('varchar', { name: 'issuing_organization', length: 255 })
  issuingOrganization!: string;

  @Column('text', { name: 'document_url' })
  documentUrl!: string;

  @Column('varchar', { name: 'file_name', length: 255 })
  fileName!: string;

  @Column('integer', { name: 'file_size' })
  fileSize!: number;

  @Column({ name: 'uploaded_at' })
  uploadedAt!: Date;

  @ManyToOne(
    () => TrainerVerificationTypeormEntity,
    (verification) => verification.certificates,
    { onDelete: 'CASCADE' },
  )
  @JoinColumn({ name: 'trainer_verification_id' })
  verification!: TrainerVerificationTypeormEntity;
}
