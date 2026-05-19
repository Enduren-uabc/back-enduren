import { SocialProfile } from '../entities/social-profile.entity';

export interface SocialProfileRepository {
  save(profile: SocialProfile): Promise<SocialProfile>;
  findByUserId(userId: string): Promise<SocialProfile | null>;
  findByUserIds(userIds: string[]): Promise<SocialProfile[]>;
  searchByQuery(query: string): Promise<SocialProfile[]>;
}
