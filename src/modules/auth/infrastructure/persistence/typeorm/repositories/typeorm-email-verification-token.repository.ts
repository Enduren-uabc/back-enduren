import { Injectable } from '@nestjs/common';
import { Repository, IsNull } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { EmailVerificationToken } from '../../../../domain/entities/email-verification-token.entity';
import { EmailVerificationTokenRepository } from '../../../../domain/repositories/email-verification-token.repository';
import { EmailVerificationTokenTypeormEntity } from '../entities/email-verification-token-typeorm.entity';

@Injectable()
export class TypeormEmailVerificationTokenRepository implements EmailVerificationTokenRepository {
  constructor(
    @InjectRepository(EmailVerificationTokenTypeormEntity)
    private readonly ormRepo: Repository<EmailVerificationTokenTypeormEntity>,
  ) {}

  async save(token: EmailVerificationToken): Promise<EmailVerificationToken> {
    const entity = this.toOrm(token);
    const saved = await this.ormRepo.save(entity);
    return this.toDomain(saved);
  }

  async findByToken(token: string): Promise<EmailVerificationToken | null> {
    const entity = await this.ormRepo.findOne({ where: { token } });
    return entity ? this.toDomain(entity) : null;
  }

  async findValidByUserId(
    userId: string,
  ): Promise<EmailVerificationToken | null> {
    const entity = await this.ormRepo.findOne({
      where: { userId, usedAt: IsNull() },
      order: { createdAt: 'DESC' },
    });
    return entity ? this.toDomain(entity) : null;
  }

  async deleteByUserId(userId: string): Promise<void> {
    await this.ormRepo.delete({ userId });
  }

  private toOrm(
    token: EmailVerificationToken,
  ): EmailVerificationTokenTypeormEntity {
    const entity = new EmailVerificationTokenTypeormEntity();
    entity.id = token.id;
    entity.userId = token.userId;
    entity.token = token.token;
    entity.expiresAt = token.expiresAt;
    entity.usedAt = token.usedAt;
    entity.createdAt = token.createdAt;
    return entity;
  }

  private toDomain(
    entity: EmailVerificationTokenTypeormEntity,
  ): EmailVerificationToken {
    return EmailVerificationToken.reconstitute({
      id: entity.id,
      userId: entity.userId,
      token: entity.token,
      expiresAt: entity.expiresAt,
      usedAt: entity.usedAt,
      createdAt: entity.createdAt,
    });
  }
}
