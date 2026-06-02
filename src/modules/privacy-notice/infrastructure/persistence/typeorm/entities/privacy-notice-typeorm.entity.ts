import { Entity, PrimaryColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('privacy_notices')
export class PrivacyNoticeTypeormEntity {
  @PrimaryColumn('uuid')
  id!: string;

  @Column('varchar', { length: 20 })
  version!: string;

  @Column('text')
  content!: string;

  @Column('timestamp', { name: 'updated_at' })
  updatedAt!: Date;

  @Column('boolean', { default: true, name: 'is_active' })
  isActive!: boolean;

  @Column('varchar', { length: 64, nullable: true, name: 'content_hash' })
  contentHash!: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
