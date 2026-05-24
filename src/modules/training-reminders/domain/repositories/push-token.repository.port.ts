import { PushToken } from '../entities/push-token.entity';

export const PUSH_TOKEN_REPOSITORY_PORT = Symbol('PUSH_TOKEN_REPOSITORY_PORT');

export interface PushTokenRepository {
  findByUserId(userId: string): Promise<PushToken[]>;
  save(token: PushToken): Promise<PushToken>;
  deleteByToken(token: string): Promise<void>;
}
