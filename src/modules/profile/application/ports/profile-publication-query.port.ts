export interface ProfilePublicationItem {
  id: string;
  authorUserId: string;
  title: string;
  content: string;
  mediaUrls: string[];
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
