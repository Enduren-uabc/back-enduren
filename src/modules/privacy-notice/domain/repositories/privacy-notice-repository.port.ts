import { PrivacyNotice } from '../entities/privacy-notice.entity';

export const PRIVACY_NOTICE_REPOSITORY_PORT = 'PrivacyNoticeRepositoryPort';

export interface PrivacyNoticeRepositoryPort {
  findCurrent(): Promise<PrivacyNotice | null>;
}
