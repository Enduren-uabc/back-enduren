import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  Index,
  type ColumnType,
} from 'typeorm';

const dateTimeColumnType: ColumnType = process.env.NODE_ENV === 'test' ? 'datetime' : 'timestamp';

@Entity('social_auth_codes')
export class SocialAuthCodeTypeormEntity {
  @PrimaryColumn('uuid')
  id!: string;

  @Column('uuid', { name: 'user_id' })
  userId!: string;

  @Column('varchar')
  provider!: string;

  @Index({ unique: true })
  @Column('varchar', { length: 64 })
  code!: string;

  @Column(dateTimeColumnType, { name: 'expires_at' })
  expiresAt!: Date;

  @Column(dateTimeColumnType, { nullable: true, name: 'used_at' })
  usedAt!: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
