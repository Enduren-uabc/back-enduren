import { PasswordResetToken } from '../entities/password-reset-token.entity';

export const PASSWORD_RESET_TOKEN_REPOSITORY_PORT = Symbol('PASSWORD_RESET_TOKEN_REPOSITORY_PORT');

export interface PasswordResetTokenRepository {
  save(token: PasswordResetToken): Promise<PasswordResetToken>;
  findByToken(token: string): Promise<PasswordResetToken | null>;
  findValidByUserId(userId: string): Promise<PasswordResetToken | null>;
  deleteByUserId(userId: string): Promise<void>;
}
