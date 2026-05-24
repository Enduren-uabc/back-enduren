import { Column, CreateDateColumn, Entity, PrimaryColumn } from 'typeorm';

@Entity('specialty_catalog')
export class SpecialtyCatalogTypeormEntity {
  @PrimaryColumn('varchar', { length: 50 })
  key!: string;

  @Column('varchar', { length: 100 })
  displayName!: string;

  @Column('varchar', { length: 50 })
  category!: string;

  @Column('varchar', { length: 500, nullable: true })
  iconUrl!: string | null;

  @CreateDateColumn()
  createdAt!: Date;
}
