import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { SpecialtyCatalogTypeormEntity } from './specialty-catalog-typeorm.entity';
import { TrainerVerificationTypeormEntity } from './trainer-verification-typeorm.entity';

@Entity('trainer_verification_specialties')
export class TrainerVerificationSpecialtyTypeormEntity {
  @PrimaryColumn('uuid')
  id!: string;

  @Column('uuid')
  trainerVerificationId!: string;

  @Column('varchar', { length: 50 })
  specialtyKey!: string;

  @ManyToOne(
    () => TrainerVerificationTypeormEntity,
    (verification) => verification.specialties,
    { onDelete: 'CASCADE' },
  )
  @JoinColumn({ name: 'trainerVerificationId' })
  verification!: TrainerVerificationTypeormEntity;

  @ManyToOne(() => SpecialtyCatalogTypeormEntity, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'specialtyKey' })
  specialty!: SpecialtyCatalogTypeormEntity;
}
