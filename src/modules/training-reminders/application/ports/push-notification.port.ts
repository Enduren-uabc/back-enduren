export const PUSH_NOTIFICATION_PORT = Symbol('PUSH_NOTIFICATION_PORT');

export interface PushNotificationPort {
  send(userId: string, title: string, body: string, pushTokens: string[]): Promise<void>;
}
