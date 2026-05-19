import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { CurrentActor } from '../../../application/ports/current-actor.port';

export const TrainingActor = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): CurrentActor => {
    const request = ctx.switchToHttp().getRequest();
    return { userId: request.user?.sub ?? '' };
  },
);
