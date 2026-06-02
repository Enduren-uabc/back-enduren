import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryColumn,
} from 'typeorm';

@Entity('publication_media')
export class PublicationMediaTypeormEntity {
  @PrimaryColumn('uuid')
  id!: string;

  @Index()
  @Column('uuid', { name: 'publication_id', nullable: true })
  publicationId!: string | null;

  @Column('text')
  url!: string;

  @Column('varchar', { length: 255, name: 'file_name' })
  fileName!: string;

  @Column('integer', { name: 'file_size' })
  fileSize!: number;

  @Column('varchar', { length: 100, name: 'mime_type' })
  mimeType!: string;

  @Column('integer', { name: 'sort_order', default: 0 })
  sortOrder!: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
