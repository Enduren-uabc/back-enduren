import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
  Unique,
} from 'typeorm';
import { PublicationTypeormEntity } from './publication-typeorm.entity';

@Entity('publication_reactions')
@Unique('UQ_publication_reactions_publication_author', [
  'publicationId',
  'authorUserId',
])
export class PublicationReactionTypeormEntity {
  @PrimaryColumn('uuid')
  id!: string;

  @Index()
  @Column('uuid', { name: 'publication_id' })
  publicationId!: string;

  @Index()
  @Column('uuid', { name: 'author_user_id' })
  authorUserId!: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @ManyToOne(() => PublicationTypeormEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'publication_id' })
  publication!: PublicationTypeormEntity;
}
