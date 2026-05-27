export interface ProfilePublicationItem {
  id: string;
  authorUserId: string;
  authorDisplayName?: string;
  authorAvatarUrl?: string;
  title: string;
  content: string;
  mediaUrls: string[];
  media?: {
    id: string;
    url: string;
    fileName: string;
    fileSize: number;
    mimeType: string;
    sortOrder: number;
    createdAt: string;
  }[];
  workoutSessionId?: string | null;
  exerciseSummary?: Record<string, unknown> | null;
  reactionCount: number;
  recentReactorNames: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ProfilePublicationPage {
  items: ProfilePublicationItem[];
  limit: number;
  offset: number;
  total: number;
  hasMore: boolean;
}

export interface ProfilePublicationQueryPort {
  findByAuthorUserId(input: {
    authorUserId: string;
    limit: number;
    offset: number;
  }): Promise<ProfilePublicationPage>;
}
