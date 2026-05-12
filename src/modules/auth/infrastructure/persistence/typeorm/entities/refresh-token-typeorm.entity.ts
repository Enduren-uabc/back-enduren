import { Entity, PrimaryColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('refresh_tokens')
export class RefreshTokenTypeormEntity {
  @PrimaryColumn('uuid')
  id!: string;

  @Column('varchar', { unique: true })
  token!: string;

  @Column('uuid')
  userId!: string;

  @Column('datetime')
  expiresAt!: Date;

  @CreateDateColumn()
  createdAt!: Date;

  @Column('datetime', { nullable: true })
  usedAt!: Date | null;
}
