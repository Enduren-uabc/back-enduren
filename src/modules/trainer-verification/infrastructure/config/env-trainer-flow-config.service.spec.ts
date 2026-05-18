import { ConfigService } from '@nestjs/config';
import { EnvTrainerFlowConfigService } from './env-trainer-flow-config.service';

describe('EnvTrainerFlowConfigService', () => {
  it('returns legacy mode when Powerspike is false', () => {
    const configService = {
      get: jest.fn().mockReturnValue('false'),
    } as unknown as ConfigService;
    const service = new EnvTrainerFlowConfigService(configService);

    expect(service.isPowerspikeEnabled()).toBe(false);
    expect(service.getFlowConfig()).toEqual({
      powerspike: false,
      flowMode: 'legacy',
    });
  });

  it('returns powerspike mode when Powerspike is true', () => {
    const configService = {
      get: jest.fn().mockReturnValue('true'),
    } as unknown as ConfigService;
    const service = new EnvTrainerFlowConfigService(configService);

    expect(service.isPowerspikeEnabled()).toBe(true);
    expect(service.getFlowConfig()).toEqual({
      powerspike: true,
      flowMode: 'powerspike',
    });
  });

  it('returns legacy mode when Powerspike is not defined', () => {
    const configService = {
      get: jest.fn().mockReturnValue(undefined),
    } as unknown as ConfigService;
    const service = new EnvTrainerFlowConfigService(configService);

    expect(service.isPowerspikeEnabled()).toBe(false);
    expect(service.getFlowConfig()).toEqual({
      powerspike: false,
      flowMode: 'legacy',
    });
  });

  it('is case insensitive when reading true', () => {
    const configService = {
      get: jest.fn().mockReturnValue('True'),
    } as unknown as ConfigService;
    const service = new EnvTrainerFlowConfigService(configService);

    expect(service.isPowerspikeEnabled()).toBe(true);
  });
});
