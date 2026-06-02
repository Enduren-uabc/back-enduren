import { Injectable } from '@nestjs/common';
import {
  SocialAuthVerifierPort,
  SocialUserData,
} from '../../application/ports/social-auth-verifier.port';

@Injectable()
export class DevSocialVerifier implements SocialAuthVerifierPort {
  async verify(
    provider: 'google' | 'apple',
    idToken: string,
  ): Promise<SocialUserData> {
    const prefix = provider === 'google' ? 'google|' : 'apple|';
    if (idToken.startsWith(prefix)) {
      const email = idToken.substring(prefix.length);
      if (!email.includes('@')) {
        throw new Error(
          `Invalid dev token format. Expected "${prefix}<email>"`,
        );
      }
      const name = email.split('@')[0];
      return {
        socialId: `dev_${provider}_${name}`,
        email,
        name,
        avatarUrl: null,
      };
    }

    throw new Error(
      `Invalid dev ${provider} token. Use format "${prefix}<email>"`,
    );
  }
}
