import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Inject,
  Injectable,
} from '@nestjs/common';
import {
  TrainerVerificationRepository,
  TRAINER_VERIFICATION_REPOSITORY_PORT,
} from '../../../domain/repositories/trainer-verification.repository.port';

@Injectable()
export class TrainerVerifiedGuard implements CanActivate {
  constructor(
    @Inject(TRAINER_VERIFICATION_REPOSITORY_PORT)
    private readonly verificationRepository: TrainerVerificationRepository,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<{
      user?: { sub: string; role: string };
    }>();
    const actor = request.user;
    if (actor?.role !== 'trainer') {
      throw new ForbiddenException(
        'Only trainer users can access this resource',
      );
    }

    const verification = await this.verificationRepository.findByUserId(
      actor.sub,
    );
    if (verification?.verificationStatus !== 'approved') {
      throw new ForbiddenException('Trainer account is not verified');
    }
    return true;
  }
}
