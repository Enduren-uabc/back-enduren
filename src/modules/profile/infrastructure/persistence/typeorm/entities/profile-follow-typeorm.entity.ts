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
import { SocialProfileTypeormEntity } from './social-profile-typeorm.entity';

@Entity('profile_follows')
@Unique('UQ_profile_follows_follower_followed', [
  'followerUserId',
  'followedUserId',
])
export class ProfileFollowTypeormEntity {
  @PrimaryColumn('uuid')
  id!: string;

  @Index()
  @Column('uuid')
  followerUserId!: string;

  @Index()
  @Column('uuid')
  followedUserId!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @ManyToOne(() => SocialProfileTypeormEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'followerUserId', referencedColumnName: 'userId' })
  follower!: SocialProfileTypeormEntity;

  @ManyToOne(() => SocialProfileTypeormEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'followedUserId', referencedColumnName: 'userId' })
  followed!: SocialProfileTypeormEntity;
}
