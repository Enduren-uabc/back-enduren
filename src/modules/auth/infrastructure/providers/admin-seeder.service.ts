import {
  Injectable,
  Inject,
  Logger,
  OnApplicationBootstrap,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  UserRepository,
  USER_REPOSITORY_PORT,
} from '../../../users/domain/repositories/user.repository';
import {
  PasswordHasher,
  PASSWORD_HASHER_PORT,
} from './password-hasher.provider';
import { User } from '../../../users/domain/entities/user.entity';

@Injectable()
export class AdminSeeder implements OnApplicationBootstrap {
  private readonly logger = new Logger(AdminSeeder.name);

  constructor(
    @Inject(USER_REPOSITORY_PORT)
    private readonly userRepository: UserRepository,
    @Inject(PASSWORD_HASHER_PORT)
    private readonly passwordHasher: PasswordHasher,
    private readonly configService: ConfigService,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    const email = this.configService.get<string>('ADMIN_EMAIL');
    const password = this.configService.get<string>('ADMIN_PASSWORD');

    if (!email || !password) {
      this.logger.warn(
        'ADMIN_EMAIL or ADMIN_PASSWORD not set in .env — skipping admin seed',
      );
      return;
    }

    const exists = await this.userRepository.findByEmail(email);
    if (exists) {
      this.logger.log(`Admin user already exists (${email})`);
      return;
    }

    const passwordHash = await this.passwordHasher.hash(password);
    const admin = User.create(
      crypto.randomUUID(),
      email,
      'admin',
      passwordHash,
      'admin',
    );
    await this.userRepository.save(admin);
    this.logger.log(`Admin user created successfully (${email})`);
  }
}
