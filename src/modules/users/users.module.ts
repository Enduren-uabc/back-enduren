import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserTypeormEntity } from './infrastructure/persistence/typeorm/entities/user-typeorm.entity';
import { TypeormUserRepository } from './infrastructure/persistence/typeorm/repositories/typeorm-user.repository';
import { USER_REPOSITORY_PORT } from './domain/repositories/user.repository';
import {
  PASSWORD_HASHER_PORT,
  BcryptPasswordHasher,
} from '../auth/infrastructure/providers/password-hasher.provider';
import { CreateUserUseCase } from './application/use-cases/create-user/create-user.use-case';
import { UserController } from './presentation/http/controllers/user.controller';

@Module({
  imports: [TypeOrmModule.forFeature([UserTypeormEntity])],
  providers: [
    {
      provide: USER_REPOSITORY_PORT,
      useClass: TypeormUserRepository,
    },
    {
      provide: PASSWORD_HASHER_PORT,
      useClass: BcryptPasswordHasher,
    },
    CreateUserUseCase,
  ],
  controllers: [UserController],
  exports: [USER_REPOSITORY_PORT, PASSWORD_HASHER_PORT],
})
export class UsersModule {}
