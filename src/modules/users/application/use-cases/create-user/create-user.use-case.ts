import { Injectable, Inject } from '@nestjs/common';
import { User, UserRole } from '../../../domain/entities/user.entity';
import {
  UserDomainError,
  UserErrorCode,
} from '../../../domain/errors/user-domain.error';
import {
  UserRepository,
  USER_REPOSITORY_PORT,
} from '../../../domain/repositories/user.repository';
import {
  PasswordHasher,
  PASSWORD_HASHER_PORT,
} from '../../../../auth/infrastructure/providers/password-hasher.provider';

export interface CreateUserInput {
  email: string;
  username: string;
  password: string;
  role?: 'trainer' | 'user';
}

export interface CreateUserOutput {
  id: string;
  email: string;
  username: string;
  role: string;
  status: string;
  createdAt: Date;
}

@Injectable()
export class CreateUserUseCase {
  constructor(
    @Inject(USER_REPOSITORY_PORT)
    private readonly userRepository: UserRepository,
    @Inject(PASSWORD_HASHER_PORT)
    private readonly passwordHasher: PasswordHasher,
  ) {}

  async execute(input: CreateUserInput): Promise<CreateUserOutput> {
    const email = input.email.toLowerCase().trim();
    const username = input.username.trim();

    const emailExists = await this.userRepository.existsByEmail(email);
    if (emailExists) {
      throw new UserDomainError(
        UserErrorCode.USER_EMAIL_ALREADY_EXISTS,
        'Email already registered',
      );
    }

    const usernameExists = await this.userRepository.existsByUsername(username);
    if (usernameExists) {
      throw new UserDomainError(
        UserErrorCode.USER_USERNAME_ALREADY_EXISTS,
        'Username already taken',
      );
    }

    const passwordHash = await this.passwordHasher.hash(input.password);
    const role: UserRole = input.role ?? 'user';
    const user = User.create(
      crypto.randomUUID(),
      email,
      username,
      passwordHash,
      role,
    );
    const saved = await this.userRepository.save(user);

    return {
      id: saved.id,
      email: saved.email,
      username: saved.username,
      role: saved.role,
      status: saved.status,
      createdAt: saved.createdAt,
    };
  }
}
