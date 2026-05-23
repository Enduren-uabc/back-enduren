import { Injectable } from '@nestjs/common';
import { Repository, IsNull } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { PasswordResetToken } from '../../../../domain/entities/password-reset-token.entity';
import { PasswordResetTokenRepository } from '../../../../domain/repositories/password-reset-token.repository';
import { PasswordResetTokenTypeormEntity } from '../entities/password-reset-token-typeorm.entity';

@Injectable()
export class TypeormPasswordResetTokenRepository implements PasswordResetTokenRepository {
  constructor(
    @InjectRepository(PasswordResetTokenTypeormEntity)
    private readonly ormRepo: Repository<PasswordResetTokenTypeormEntity>,
  ) {}

  async save(token: PasswordResetToken): Promise<PasswordResetToken> {
    const entity = this.toOrm(token);
    const saved = await this.ormRepo.save(entity);
    return this.toDomain(saved);
  }

  async findByToken(token: string): Promise<PasswordResetToken | null> {
    const entity = await this.ormRepo.findOne({ where: { token } });
    return entity ? this.toDomain(entity) : null;
  }

  async findValidByUserId(userId: string): Promise<PasswordResetToken | null> {
    const entity = await this.ormRepo.findOne({
      where: { userId, usedAt: IsNull() },
      order: { createdAt: 'DESC' },
    });
    return entity ? this.toDomain(entity) : null;
  }

  async deleteByUserId(userId: string): Promise<void> {
    await this.ormRepo.delete({ userId });
  }

  private toOrm(token: PasswordResetToken): PasswordResetTokenTypeormEntity {
    const entity = new PasswordResetTokenTypeormEntity();
    entity.id = token.id;
    entity.userId = token.userId;
    entity.token = token.token;
    entity.expiresAt = token.expiresAt;
    entity.usedAt = token.usedAt;
    entity.createdAt = token.createdAt;
    return entity;
  }

  private toDomain(entity: PasswordResetTokenTypeormEntity): PasswordResetToken {
    return PasswordResetToken.reconstitute({
      id: entity.id,
      userId: entity.userId,
      token: entity.token,
      expiresAt: entity.expiresAt,
      usedAt: entity.usedAt,
      createdAt: entity.createdAt,
    });
  }
}
