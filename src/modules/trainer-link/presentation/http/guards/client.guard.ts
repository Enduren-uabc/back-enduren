import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';

@Injectable()
export class ClientGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<{
      user?: { sub: string; role: string };
    }>();
    const user = request.user;
    if (user?.role !== 'user') {
      throw new ForbiddenException(
        'Only client users can access this resource',
      );
    }
    return true;
  }
}
