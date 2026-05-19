export interface ProfileDto {
  userId: string;
  displayName: string;
  handle: string;
  bio: string | null;
  avatarUrl: string | null;
}

export interface PublicProfileDto extends ProfileDto {
  followersCount: number;
  followingCount: number;
}
