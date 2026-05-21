import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LinkConfigPort } from '../../application/ports/link-config.port';

@Injectable()
export class EnvLinkConfigService implements LinkConfigPort {
  constructor(private readonly configService: ConfigService) {}

  get maxActiveTrainersPerClient(): number {
    return this.configService.get<number>('MAX_ACTIVE_TRAINERS_PER_CLIENT', 1);
  }

  get maxActiveClientsPerTrainer(): number {
    return this.configService.get<number>('MAX_ACTIVE_CLIENTS_PER_TRAINER', 50);
  }
}
