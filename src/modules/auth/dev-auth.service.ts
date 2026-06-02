import { Injectable, UnauthorizedException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import type { AuthResponseDto } from './dev-auth.dto';

interface DevUser {
  email: string;
  username: string;
  password: string;
}

const DEV_USER_ID = '00000000-0000-0000-0000-000000000001';
const DEV_ROLE = 'user';

@Injectable()
export class DevAuthService {
  constructor(private readonly dataSource: DataSource) {}

  private readonly usersByEmail = new Map<string, DevUser>([
    [
      'test@endure.local',
      {
        email: 'test@endure.local',
        username: 'endure_test',
        password: 'Password1',
      },
    ],
  ]);

  public async register(input: DevUser): Promise<AuthResponseDto> {
    const normalizedEmail = input.email.trim().toLowerCase();
    const user: DevUser = {
      email: normalizedEmail,
      username: input.username.trim(),
      password: input.password,
    };

    this.usersByEmail.set(normalizedEmail, user);
    await this.ensureProfile(user);
    return this.toAuthResponse(user);
  }

  public async login(
    email: string,
    password: string,
  ): Promise<AuthResponseDto> {
    const user = this.usersByEmail.get(email.trim().toLowerCase());

    if (user?.password !== password) {
      throw new UnauthorizedException('Invalid email or password');
    }

    await this.ensureProfile(user);
    return this.toAuthResponse(user);
  }

  public async me(): Promise<AuthResponseDto> {
    const user = this.usersByEmail.get('test@endure.local');
    if (!user) {
      throw new UnauthorizedException('Dev user is not available');
    }

    await this.ensureProfile(user);
    return this.toAuthResponse(user);
  }

  private async ensureProfile(user: DevUser): Promise<void> {
    await this.dataSource.query(
      `
        INSERT INTO social_profiles ("userId", "displayName", handle, bio, "avatarUrl", "createdAt", "updatedAt")
        VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
        ON CONFLICT ("userId") DO UPDATE SET
          "displayName" = EXCLUDED."displayName",
          handle = EXCLUDED.handle,
          "updatedAt" = NOW()
      `,
      [
        DEV_USER_ID,
        user.username,
        user.username.toLowerCase(),
        'Perfil dev de Endure',
        null,
      ],
    );
  }

  private toAuthResponse(user: DevUser): AuthResponseDto {
    return {
      userId: DEV_USER_ID,
      role: DEV_ROLE,
      email: user.email,
      username: user.username,
      onboardingCompleted: true,
    };
  }
}
