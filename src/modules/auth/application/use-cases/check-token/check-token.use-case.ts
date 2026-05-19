import { Injectable, Inject } from '@nestjs/common';
import {
  UserRepository,
  USER_REPOSITORY_PORT,
} from '../../../../users/domain/repositories/user.repository';

export interface CheckTokenOutput {
  id: string;
  email: string;
  username: string;
  role: string;
}

@Injectable()
export class CheckTokenUseCase {
  constructor(
    @Inject(USER_REPOSITORY_PORT)
    private readonly userRepository: UserRepository,
  ) {}

  async execute(userId: string): Promise<CheckTokenOutput | null> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      return null;
    }
    return {
      id: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
    };
  }
}
