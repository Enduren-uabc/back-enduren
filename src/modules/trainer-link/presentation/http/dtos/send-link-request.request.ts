import { IsOptional, IsString, MaxLength, IsUUID } from 'class-validator';

export class SendLinkRequestRequestDto {
  @IsUUID()
  trainerId!: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  message?: string;
}
