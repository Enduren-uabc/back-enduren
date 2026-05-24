import {
  IsString,
  IsOptional,
  IsInt,
  Min,
  Length,
  Matches,
} from 'class-validator';

export class AddExerciseRequestDto {
  @IsString()
  @Length(1, 100)
  @Matches(/[a-zA-Z]/, {
    message: 'El nombre debe contener al menos una letra',
  })
  name!: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  order?: number;
}
