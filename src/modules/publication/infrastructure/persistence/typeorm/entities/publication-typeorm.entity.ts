import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('publications')
export class PublicationTypeormEntity {
  @PrimaryColumn('uuid')
  id!: string;

  @Index()
  @Column('uuid')
  authorUserId!: string;

  @Column('varchar', { length: 120 })
  title!: string;

  @Column('varchar', { length: 2000 })
  content!: string;

  @Column('text', { array: true, default: '{}' })
  mediaUrls!: string[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
