import {
  ArrayMaxSize,
  IsArray,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  MinLength,
} from 'class-validator';
import { MAX_PUBLICATION_MEDIA_URLS } from '../../../domain/value-objects/publication-media-urls.value-object';
import { MAX_PUBLICATION_CONTENT_LENGTH } from '../../../domain/value-objects/publication-content.value-object';
import { MAX_PUBLICATION_TITLE_LENGTH } from '../../../domain/value-objects/publication-title.value-object';

export class CreatePublicationRequestDto {
  @IsString()
  @MinLength(1)
  @MaxLength(MAX_PUBLICATION_TITLE_LENGTH)
  title!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(MAX_PUBLICATION_CONTENT_LENGTH)
  content!: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(MAX_PUBLICATION_MEDIA_URLS)
  @IsUrl({ require_protocol: true }, { each: true })
  mediaUrls?: string[];
}
