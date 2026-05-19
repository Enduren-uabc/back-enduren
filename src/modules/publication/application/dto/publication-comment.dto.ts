export interface PublicationCommentDto {
  id: string;
  publicationId: string;
  authorUserId: string;
  content: string;
  createdAt: Date;
}
