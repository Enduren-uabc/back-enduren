import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OAuth2Client } from 'google-auth-library';
import {
  SocialAuthVerifierPort,
  SocialUserData,
} from '../../application/ports/social-auth-verifier.port';

@Injectable()
export class GoogleVerifier implements SocialAuthVerifierPort {
  private readonly client: OAuth2Client;
  private readonly clientId: string;

  constructor(private readonly configService: ConfigService) {
    this.clientId = this.configService.get<string>('GOOGLE_CLIENT_ID', '');
    this.client = new OAuth2Client(this.clientId);
  }

  async verify(
    provider: 'google' | 'apple',
    idToken: string,
  ): Promise<SocialUserData> {
    if (provider !== 'google') {
      throw new Error('GoogleVerifier only supports google provider');
    }

    if (!this.clientId) {
      throw new Error('GOOGLE_CLIENT_ID is not configured');
    }

    const ticket = await this.client.verifyIdToken({
      idToken,
      audience: this.clientId,
    });

    const payload = ticket.getPayload();

    if (!payload) {
      throw new Error('Invalid Google ID token: no payload');
    }

    if (!payload.sub || !payload.email) {
      throw new Error('Invalid Google ID token: missing sub or email');
    }

    return {
      socialId: payload.sub,
      email: payload.email,
      name: payload.name ?? payload.email.split('@')[0],
      avatarUrl: payload.picture ?? null,
    };
  }
}
