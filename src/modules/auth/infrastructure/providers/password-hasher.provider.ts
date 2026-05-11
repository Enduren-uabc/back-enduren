import { Injectable } from '@nestjs/common';
import { hash, compare } from 'bcryptjs';

export const PASSWORD_HASHER_PORT = Symbol('PASSWORD_HASHER_PORT');

export interface PasswordHasher {
  hash(password: string): Promise<string>;
  compare(password: string, hash: string): Promise<boolean>;
}

@Injectable()
export class BcryptPasswordHasher implements PasswordHasher {
  async hash(password: string): Promise<string> {
    return hash(password, 12);
  }

  async compare(password: string, hash: string): Promise<boolean> {
    return compare(password, hash);
  }
}
