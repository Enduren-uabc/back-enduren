import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  type ColumnType,
} from 'typeorm';

const dateTimeColumnType: ColumnType =
  process.env.NODE_ENV === 'test' ? 'datetime' : 'timestamp';

@Entity('refresh_tokens')
export class RefreshTokenTypeormEntity {
  @PrimaryColumn('uuid')
  id!: string;

  @Column('varchar', { unique: true })
  token!: string;

  @Column('uuid', { name: 'user_id' })
  userId!: string;

  @Column({ type: dateTimeColumnType, name: 'expires_at' })
  expiresAt!: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @Column({ type: dateTimeColumnType, nullable: true, name: 'used_at' })
  usedAt!: Date | null;
}
