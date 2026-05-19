import { User } from '../entities/user.entity';

export const USER_REPOSITORY_PORT = Symbol('USER_REPOSITORY_PORT');

export interface UserRepository {
  save(user: User): Promise<User>;
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  findByUsername(username: string): Promise<User | null>;
  existsByEmail(email: string): Promise<boolean>;
  existsByUsername(username: string): Promise<boolean>;
}
