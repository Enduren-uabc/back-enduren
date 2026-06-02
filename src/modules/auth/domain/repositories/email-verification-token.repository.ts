import { EmailVerificationToken } from '../entities/email-verification-token.entity';

export const EMAIL_VERIFICATION_TOKEN_REPOSITORY_PORT = Symbol(
  'EMAIL_VERIFICATION_TOKEN_REPOSITORY_PORT',
);

export interface EmailVerificationTokenRepository {
  save(token: EmailVerificationToken): Promise<EmailVerificationToken>;
  findByToken(token: string): Promise<EmailVerificationToken | null>;
  findValidByUserId(userId: string): Promise<EmailVerificationToken | null>;
  deleteByUserId(userId: string): Promise<void>;
}
