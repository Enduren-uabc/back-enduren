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

  @Column('uuid')
  userId!: string;

  @Column({ type: dateTimeColumnType })
  expiresAt!: Date;

  @CreateDateColumn()
  createdAt!: Date;

  @Column({ type: dateTimeColumnType, nullable: true })
  usedAt!: Date | null;
}
