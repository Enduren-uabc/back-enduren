import { Injectable } from '@nestjs/common';
import {
  SocialAuthVerifierPort,
  SocialUserData,
} from '../../application/ports/social-auth-verifier.port';
import { GoogleVerifier } from './google-verifier.provider';
import { AppleVerifier } from './apple-verifier.provider';

@Injectable()
export class SocialVerifierFactory implements SocialAuthVerifierPort {
  constructor(
    private readonly googleVerifier: GoogleVerifier,
    private readonly appleVerifier: AppleVerifier,
  ) {}

  async verify(provider: 'google' | 'apple', idToken: string): Promise<SocialUserData> {
    if (provider === 'google') {
      return this.googleVerifier.verify(provider, idToken);
    }
    return this.appleVerifier.verify(provider, idToken);
  }
}
