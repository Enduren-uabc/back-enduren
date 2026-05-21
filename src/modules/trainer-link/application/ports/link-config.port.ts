export const LINK_CONFIG_PORT = Symbol('LINK_CONFIG_PORT');

export interface LinkConfigPort {
  maxActiveTrainersPerClient: number;
  maxActiveClientsPerTrainer: number;
}
