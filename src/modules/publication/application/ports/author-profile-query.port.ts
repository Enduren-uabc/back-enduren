export const AUTHOR_PROFILE_QUERY_PORT = Symbol('AUTHOR_PROFILE_QUERY_PORT');

export interface AuthorProfile {
  userId: string;
  displayName: string;
  avatarUrl: string | null;
}

export interface AuthorProfileQueryPort {
  findProfilesByUserIds(userIds: string[]): Promise<AuthorProfile[]>;
  ensureProfilesExist(userIds: string[]): Promise<AuthorProfile[]>;
}
