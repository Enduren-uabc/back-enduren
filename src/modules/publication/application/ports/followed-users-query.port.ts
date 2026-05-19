export interface FollowedUsersQueryPort {
  findFollowedUserIds(userId: string): Promise<string[]>;
}
