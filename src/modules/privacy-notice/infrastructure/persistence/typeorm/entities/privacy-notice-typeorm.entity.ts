import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('privacy_notices')
export class PrivacyNoticeTypeormEntity {
  @PrimaryColumn('uuid')
  id!: string;

  @Column('varchar', { length: 20 })
  version!: string;

  @Column('text')
  content!: string;

  @Column('timestamp')
  updatedAt!: Date;

  @Column('boolean', { default: true })
  isActive!: boolean;

  @Column('varchar', { length: 64, nullable: true })
  contentHash!: string | null;

  @CreateDateColumn()
  createdAt!: Date;
}
