import { Injectable } from '@nestjs/common';
import { CurrentActor } from '../../application/ports/current-actor.port';

/**
 * DevActorService provides a hardcoded actor for development.
 * When auth is built, swap this for AuthActorService
 * without changing use cases.
 */
@Injectable()
export class DevActorService implements CurrentActor {
  public userId = '00000000-0000-0000-0000-000000000001';
}
