export class AuthResponseDto {
  id!: string;
  email!: string;
  username!: string;
  role!: string;
  emailVerified!: boolean;
  accessToken?: string;
  refreshToken?: string;
}
