import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Inject,
} from '@nestjs/common';
import { Request } from 'express';
import {
  TRAINER_LINK_REPOSITORY_PORT,
  TrainerLinkRepositoryPort,
} from '../../../trainer-link/domain/repositories/trainer-link.repository.port';

@Injectable()
export class ActiveLinkGuard implements CanActivate {
  constructor(
    @Inject(TRAINER_LINK_REPOSITORY_PORT)
    private readonly linkRepository: TrainerLinkRepositoryPort,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request: Request = context.switchToHttp().getRequest();
    const user = request.user as { sub: string } | undefined;
    const clientId =
      (request.params as Record<string, string>).clientId ||
      (request.body as Record<string, string>)?.clientId;

    if (!clientId || !user) {
      throw new ForbiddenException(
        'No existe una vinculación activa con este cliente',
      );
    }

    const link = await this.linkRepository.findActiveByTrainerIdAndClientId(
      user.sub,
      clientId,
    );
    if (!link) {
      throw new ForbiddenException(
        'No existe una vinculación activa con este cliente',
      );
    }
    return true;
  }
}
