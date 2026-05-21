import { IsOptional, IsString, MaxLength } from 'class-validator';

export class RejectLinkRequestRequestDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}
