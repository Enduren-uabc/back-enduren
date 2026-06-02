import { IsString, Length } from 'class-validator';

export class ExchangeSocialCodeDto {
  @IsString()
  @Length(1, 64)
  code!: string;
}
