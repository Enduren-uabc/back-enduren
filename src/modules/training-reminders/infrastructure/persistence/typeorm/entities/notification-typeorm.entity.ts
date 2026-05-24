import { Entity, PrimaryColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('notifications')
export class NotificationTypeormEntity {
  @PrimaryColumn('uuid')
  id!: string;

  @Column('uuid')
  userId!: string;

  @Column('varchar')
  title!: string;

  @Column('varchar')
  body!: string;

  @Column('varchar', { length: 20, default: 'reminder' })
  type!: string;

  @Column('timestamp', { nullable: true })
  readAt!: Date | null;

  @CreateDateColumn()
  createdAt!: Date;
}
