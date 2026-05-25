export interface CreatePublicationDto {
  title: string;
  content: string;
  mediaUrls?: string[];
  mediaIds?: string[];
}
