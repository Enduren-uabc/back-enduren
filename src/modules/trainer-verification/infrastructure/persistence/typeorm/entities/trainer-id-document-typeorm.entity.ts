import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { TrainerVerificationTypeormEntity } from './trainer-verification-typeorm.entity';

@Entity('trainer_id_documents')
export class TrainerIdDocumentTypeormEntity {
  @PrimaryColumn('uuid')
  id!: string;

  @Column('uuid')
  trainerVerificationId!: string;

  @Column('varchar', { length: 20 })
  documentType!: string;

  @Column('varchar', { length: 100 })
  containerName!: string;

  @Column('text')
  fileUrl!: string;

  @Column('varchar', { length: 255 })
  fileName!: string;

  @Column('integer')
  fileSize!: number;

  @Column()
  uploadedAt!: Date;

  @ManyToOne(
    () => TrainerVerificationTypeormEntity,
    (verification) => verification.idDocuments,
    { onDelete: 'CASCADE' },
  )
  @JoinColumn({ name: 'trainerVerificationId' })
  verification!: TrainerVerificationTypeormEntity;
}
