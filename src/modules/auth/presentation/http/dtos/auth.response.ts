export class AuthResponseDto {
  id!: string;
  email!: string;
  username!: string;
  role!: string;
  accessToken?: string;
  refreshToken?: string;
}
