import { Column, CreateDateColumn, Entity, PrimaryColumn } from 'typeorm';

@Entity('specialty_catalog')
export class SpecialtyCatalogTypeormEntity {
  @PrimaryColumn('varchar', { length: 50 })
  key!: string;

  @Column('varchar', { name: 'display_name', length: 100 })
  displayName!: string;

  @Column('varchar', { length: 50 })
  category!: string;

  @Column('varchar', { name: 'icon_url', length: 500, nullable: true })
  iconUrl!: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
