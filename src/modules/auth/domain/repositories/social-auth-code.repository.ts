import { SocialAuthCode } from '../entities/social-auth-code.entity';

export const SOCIAL_AUTH_CODE_REPOSITORY_PORT = Symbol(
  'SOCIAL_AUTH_CODE_REPOSITORY_PORT',
);

export interface SocialAuthCodeRepository {
  save(code: SocialAuthCode): Promise<SocialAuthCode>;
  findByCode(code: string): Promise<SocialAuthCode | null>;
  deleteByUserId(userId: string): Promise<void>;
}
