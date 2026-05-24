import { Entity, PrimaryColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('notifications')
export class NotificationTypeormEntity {
  @PrimaryColumn('uuid')
  id!: string;

  @Column('uuid', { name: 'user_id' })
  userId!: string;

  @Column('varchar')
  title!: string;

  @Column('varchar')
  body!: string;

  @Column('varchar', { length: 20, default: 'reminder' })
  type!: string;

  @Column('timestamp', { nullable: true, name: 'read_at' })
  readAt!: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
