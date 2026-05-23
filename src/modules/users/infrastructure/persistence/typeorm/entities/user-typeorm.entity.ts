import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('users')
export class UserTypeormEntity {
  @PrimaryColumn('uuid')
  id!: string;

  @Column('varchar', { unique: true })
  email!: string;

  @Column('varchar', { unique: true })
  username!: string;

  @Column('varchar')
  passwordHash!: string;

  @Column('varchar', { default: 'user' })
  role!: string;

  @Column('boolean', { default: false })
  emailVerified!: boolean;

  @Column('varchar', { default: 'active' })
  status!: string;

  @Column('varchar', { name: 'trainer_code', unique: true, nullable: true })
  trainerCode!: string | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
