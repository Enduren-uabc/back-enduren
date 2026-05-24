import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as jwt from 'jsonwebtoken';
import jwksClient from 'jwks-rsa';
import {
  SocialAuthVerifierPort,
  SocialUserData,
} from '../../application/ports/social-auth-verifier.port';

@Injectable()
export class AppleVerifier implements SocialAuthVerifierPort {
  private readonly clientId: string;
  private readonly jwks: jwksClient.JwksClient;

  constructor(private readonly configService: ConfigService) {
    this.clientId = this.configService.get<string>('APPLE_CLIENT_ID', '');
    this.jwks = jwksClient({
      jwksUri: 'https://appleid.apple.com/auth/keys',
    });
  }

  async verify(
    provider: 'google' | 'apple',
    idToken: string,
  ): Promise<SocialUserData> {
    if (provider !== 'apple') {
      throw new Error('AppleVerifier only supports apple provider');
    }

    if (!this.clientId) {
      throw new Error('APPLE_CLIENT_ID is not configured');
    }

    const decoded = jwt.decode(idToken, { complete: true });
    if (!decoded || !decoded.header?.kid) {
      throw new Error('Invalid Apple ID token: cannot decode');
    }

    const key = await this.jwks.getSigningKey(decoded.header.kid);
    const publicKey = key.getPublicKey();

    const payload = jwt.verify(idToken, publicKey, {
      algorithms: ['RS256'],
      issuer: 'https://appleid.apple.com',
      audience: this.clientId,
    }) as jwt.JwtPayload;

    if (!payload.sub || !payload.email) {
      throw new Error('Invalid Apple ID token: missing sub or email');
    }

    return {
      socialId: payload.sub,
      email: payload.email,
      name:
        ((payload as Record<string, unknown>).name as string) ??
        payload.email.split('@')[0],
      avatarUrl: null,
    };
  }
}
