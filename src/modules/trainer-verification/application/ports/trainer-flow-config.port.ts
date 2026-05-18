export const TRAINER_FLOW_CONFIG_PORT = Symbol('TRAINER_FLOW_CONFIG_PORT');

export interface FlowConfig {
  powerspike: boolean;
  flowMode: 'legacy' | 'powerspike';
}

export interface TrainerFlowConfigPort {
  isPowerspikeEnabled(): boolean;
  getFlowConfig(): FlowConfig;
}
