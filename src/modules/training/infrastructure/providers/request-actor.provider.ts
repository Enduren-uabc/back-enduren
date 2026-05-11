import { Injectable, Scope } from '@nestjs/common';
import { CurrentActor } from '../../application/ports/current-actor.port';

/**
 * Request-scoped actor service that receives userId from the request context.
 * Used by the JwtAuthGuard to inject the authenticated user.
 */
@Injectable({ scope: Scope.REQUEST })
export class RequestActorService implements CurrentActor {
  public userId = '';
}
