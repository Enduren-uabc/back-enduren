import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PrivacyNoticeTypeormEntity } from '../entities/privacy-notice-typeorm.entity';
import { PrivacyNoticeRepositoryPort } from '../../../../domain/repositories/privacy-notice-repository.port';
import { PrivacyNotice } from '../../../../domain/entities/privacy-notice.entity';

@Injectable()
export class PrivacyNoticeTypeormRepository implements PrivacyNoticeRepositoryPort {
  constructor(
    @InjectRepository(PrivacyNoticeTypeormEntity)
    private readonly repo: Repository<PrivacyNoticeTypeormEntity>,
  ) {}

  async findCurrent(): Promise<PrivacyNotice | null> {
    const entity = await this.repo.findOne({
      where: { isActive: true },
      order: { updatedAt: 'DESC' },
    });
    if (!entity) return null;
    return PrivacyNotice.reconstitute({
      id: entity.id,
      version: entity.version,
      content: entity.content,
      updatedAt: entity.updatedAt,
      isActive: entity.isActive,
      contentHash: entity.contentHash,
      createdAt: entity.createdAt,
    });
  }
}
