import { IsOptional, IsString, MaxLength } from 'class-validator';

export class SendLinkRequestRequestDto {
  @IsString()
  trainerId!: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  message?: string;
}
