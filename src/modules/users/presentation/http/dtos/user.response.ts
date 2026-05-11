import { IsOptional, IsString, IsBoolean, IsDateString } from 'class-validator';

export class UserResponseDto {
  id!: string;
  email!: string;
  username!: string;
  role!: string;
  emailVerified!: boolean;
  status!: string;
  createdAt!: Date;
  updatedAt!: Date;
}
