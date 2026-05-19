export interface UpdatePublicationDto {
  publicationId: string;
  title?: string;
  content?: string;
  mediaUrls?: string[];
}
