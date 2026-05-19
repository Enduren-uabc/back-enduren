export interface PublicationDto {
  id: string;
  authorUserId: string;
  title: string;
  content: string;
  mediaUrls: string[];
  createdAt: Date;
  updatedAt: Date;
}
