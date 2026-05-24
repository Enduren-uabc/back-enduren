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
  @Column('uuid', { name: 'follower_user_id' })
  followerUserId!: string;

  @Index()
  @Column('uuid', { name: 'followed_user_id' })
  followedUserId!: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @ManyToOne(() => SocialProfileTypeormEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'follower_user_id', referencedColumnName: 'userId' })
  follower!: SocialProfileTypeormEntity;

  @ManyToOne(() => SocialProfileTypeormEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'followed_user_id', referencedColumnName: 'userId' })
  followed!: SocialProfileTypeormEntity;
}
