import { Injectable } from '@nestjs/common';
import { CurrentActor } from '../../application/ports/current-actor.port';

@Injectable()
export class DevPublicationActorService implements CurrentActor {
  public userId = '00000000-0000-0000-0000-000000000001';
}
