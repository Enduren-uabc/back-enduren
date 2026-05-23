export interface SocialUserData {
  socialId: string;
  email: string;
  name: string;
  avatarUrl: string | null;
}

export const SOCIAL_AUTH_VERIFIER_PORT = Symbol('SOCIAL_AUTH_VERIFIER_PORT');

export interface SocialAuthVerifierPort {
  verify(provider: 'google' | 'apple', idToken: string): Promise<SocialUserData>;
}
