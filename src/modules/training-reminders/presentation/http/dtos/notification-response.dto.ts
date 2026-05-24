export class NotificationResponseDto {
  id!: string;
  title!: string;
  body!: string;
  type!: string;
  readAt!: string | null;
  createdAt!: string;
}
