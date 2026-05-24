import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { SocialAuthCode } from '../../../../domain/entities/social-auth-code.entity';
import { SocialAuthCodeRepository } from '../../../../domain/repositories/social-auth-code.repository';
import { SocialAuthCodeTypeormEntity } from '../entities/social-auth-code-typeorm.entity';

@Injectable()
export class TypeormSocialAuthCodeRepository implements SocialAuthCodeRepository {
  constructor(
    @InjectRepository(SocialAuthCodeTypeormEntity)
    private readonly ormRepo: Repository<SocialAuthCodeTypeormEntity>,
  ) {}

  async save(code: SocialAuthCode): Promise<SocialAuthCode> {
    const entity = this.toOrm(code);
    const saved = await this.ormRepo.save(entity);
    return this.toDomain(saved);
  }

  async findByCode(code: string): Promise<SocialAuthCode | null> {
    const entity = await this.ormRepo.findOne({ where: { code } });
    return entity ? this.toDomain(entity) : null;
  }

  async deleteByUserId(userId: string): Promise<void> {
    await this.ormRepo.delete({ userId });
  }

  private toOrm(code: SocialAuthCode): SocialAuthCodeTypeormEntity {
    const entity = new SocialAuthCodeTypeormEntity();
    entity.id = code.id;
    entity.userId = code.userId;
    entity.provider = code.provider;
    entity.code = code.code;
    entity.expiresAt = code.expiresAt;
    entity.usedAt = code.usedAt;
    entity.createdAt = code.createdAt;
    return entity;
  }

  private toDomain(entity: SocialAuthCodeTypeormEntity): SocialAuthCode {
    return SocialAuthCode.reconstitute({
      id: entity.id,
      code: entity.code,
      userId: entity.userId,
      provider: entity.provider,
      expiresAt: entity.expiresAt,
      usedAt: entity.usedAt,
      createdAt: entity.createdAt,
    });
  }
}
