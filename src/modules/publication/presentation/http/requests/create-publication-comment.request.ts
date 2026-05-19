import { IsString, MaxLength, MinLength } from 'class-validator';
import { MAX_PUBLICATION_COMMENT_CONTENT_LENGTH } from '../../../domain/value-objects/publication-comment-content.value-object';

export class CreatePublicationCommentRequestDto {
  @IsString()
  @MinLength(1)
  @MaxLength(MAX_PUBLICATION_COMMENT_CONTENT_LENGTH)
  content!: string;
}
