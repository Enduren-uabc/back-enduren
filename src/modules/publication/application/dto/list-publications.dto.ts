export interface ListPublicationsDto {
  limit?: number;
  offset?: number;
  filter?: 'all' | 'following';
}
