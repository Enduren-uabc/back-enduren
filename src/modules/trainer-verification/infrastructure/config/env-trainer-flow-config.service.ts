import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  FlowConfig,
  TrainerFlowConfigPort,
} from '../../application/ports/trainer-flow-config.port';

@Injectable()
export class EnvTrainerFlowConfigService implements TrainerFlowConfigPort {
  private readonly _powerspike: boolean;

  constructor(configService: ConfigService) {
    const raw = configService.get<string>('Powerspike', 'false');
    this._powerspike = (raw ?? 'false').toLowerCase() === 'true';
  }

  isPowerspikeEnabled(): boolean {
    return this._powerspike;
  }

  getFlowConfig(): FlowConfig {
    return {
      powerspike: this._powerspike,
      flowMode: this._powerspike ? 'powerspike' : 'legacy',
    };
  }
}
