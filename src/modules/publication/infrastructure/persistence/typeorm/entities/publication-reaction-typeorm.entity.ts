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
  @Column('uuid')
  publicationId!: string;

  @Index()
  @Column('uuid')
  authorUserId!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @ManyToOne(() => PublicationTypeormEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'publicationId' })
  publication!: PublicationTypeormEntity;
}
