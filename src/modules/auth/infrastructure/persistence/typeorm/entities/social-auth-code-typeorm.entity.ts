import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('social_auth_codes')
export class SocialAuthCodeTypeormEntity {
  @PrimaryColumn('uuid')
  id!: string;

  @Column('uuid')
  userId!: string;

  @Column('varchar')
  provider!: string;

  @Index({ unique: true })
  @Column('varchar', { length: 64 })
  code!: string;

  @Column('timestamp')
  expiresAt!: Date;

  @Column('timestamp', { nullable: true })
  usedAt!: Date | null;

  @CreateDateColumn()
  createdAt!: Date;
}
