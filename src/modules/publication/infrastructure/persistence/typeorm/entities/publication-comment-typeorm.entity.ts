import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
} from 'typeorm';
import { PublicationTypeormEntity } from './publication-typeorm.entity';

@Entity('publication_comments')
export class PublicationCommentTypeormEntity {
  @PrimaryColumn('uuid')
  id!: string;

  @Index()
  @Column('uuid', { name: 'publication_id' })
  publicationId!: string;

  @Index()
  @Column('uuid', { name: 'author_user_id' })
  authorUserId!: string;

  @Column('varchar', { length: 500 })
  content!: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @ManyToOne(() => PublicationTypeormEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'publication_id' })
  publication!: PublicationTypeormEntity;
}
