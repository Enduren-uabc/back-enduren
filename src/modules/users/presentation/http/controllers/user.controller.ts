import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Inject,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../../../auth/presentation/http/guards/jwt-auth.guard';
import { CurrentUser } from '../../../../auth/presentation/http/decorators/current-user.decorator';
import { JwtPayload } from '../../../../auth/presentation/http/strategies/jwt.strategy';
import { CreateUserUseCase } from '../../../application/use-cases/create-user/create-user.use-case';
import { UserRepository, USER_REPOSITORY_PORT } from '../../../domain/repositories/user.repository';
import { CreateUserRequestDto } from '../dtos/create-user.request';
import { UserResponseDto } from '../dtos/user.response';

@Controller('users')
export class UserController {
  constructor(
    private readonly createUserUseCase: CreateUserUseCase,
    @Inject(USER_REPOSITORY_PORT)
    private readonly userRepository: UserRepository,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  async create(@Body() dto: CreateUserRequestDto): Promise<UserResponseDto> {
    const result = await this.createUserUseCase.execute(dto);
    const response = new UserResponseDto();
    response.id = result.id;
    response.email = result.email;
    response.username = result.username;
    response.role = result.role;
    response.status = result.status;
    response.createdAt = result.createdAt;
    response.updatedAt = result.createdAt;
    return response;
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async me(@CurrentUser() user: JwtPayload): Promise<UserResponseDto> {
    const found = await this.userRepository.findById(user.sub);
    if (!found) {
      throw new Error('User not found');
    }
    const response = new UserResponseDto();
    response.id = found.id;
    response.email = found.email;
    response.username = found.username;
    response.role = found.role;
    response.emailVerified = found.emailVerified;
    response.status = found.status;
    response.createdAt = found.createdAt;
    response.updatedAt = found.updatedAt;
    return response;
  }
}
