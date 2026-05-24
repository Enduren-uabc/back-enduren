import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { TrainerVerificationTypeormEntity } from './trainer-verification-typeorm.entity';

@Entity('trainer_certificates')
export class TrainerCertificateTypeormEntity {
  @PrimaryColumn('uuid')
  id!: string;

  @Column('uuid')
  trainerVerificationId!: string;

  @Column('varchar', { length: 255 })
  name!: string;

  @Column('varchar', { length: 255 })
  issuingOrganization!: string;

  @Column('varchar', { length: 100 })
  containerName!: string;

  @Column('text')
  documentUrl!: string;

  @Column('varchar', { length: 255 })
  fileName!: string;

  @Column('integer')
  fileSize!: number;

  @Column()
  uploadedAt!: Date;

  @ManyToOne(
    () => TrainerVerificationTypeormEntity,
    (verification) => verification.certificates,
    { onDelete: 'CASCADE' },
  )
  @JoinColumn({ name: 'trainerVerificationId' })
  verification!: TrainerVerificationTypeormEntity;
}
