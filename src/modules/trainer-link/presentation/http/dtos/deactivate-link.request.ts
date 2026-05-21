import { IsOptional, IsString, MaxLength } from 'class-validator';

export class DeactivateLinkRequestDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}
