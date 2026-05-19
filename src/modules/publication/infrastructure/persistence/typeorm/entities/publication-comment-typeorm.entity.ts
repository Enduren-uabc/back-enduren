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
  @Column('uuid')
  publicationId!: string;

  @Index()
  @Column('uuid')
  authorUserId!: string;

  @Column('varchar', { length: 500 })
  content!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @ManyToOne(() => PublicationTypeormEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'publicationId' })
  publication!: PublicationTypeormEntity;
}
