import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { TrainerVerificationTypeormEntity } from './trainer-verification-typeorm.entity';

@Entity('trainer_id_documents')
export class TrainerIdDocumentTypeormEntity {
  @PrimaryColumn('uuid')
  id!: string;

  @Column('uuid', { name: 'trainer_verification_id' })
  trainerVerificationId!: string;

  @Column('varchar', { name: 'document_type', length: 20 })
  documentType!: string;

  @Column('text', { name: 'file_url' })
  fileUrl!: string;

  @Column('varchar', { name: 'file_name', length: 255 })
  fileName!: string;

  @Column('integer', { name: 'file_size' })
  fileSize!: number;

  @Column({ name: 'uploaded_at' })
  uploadedAt!: Date;

  @ManyToOne(
    () => TrainerVerificationTypeormEntity,
    (verification) => verification.idDocuments,
    { onDelete: 'CASCADE' },
  )
  @JoinColumn({ name: 'trainer_verification_id' })
  verification!: TrainerVerificationTypeormEntity;
}
