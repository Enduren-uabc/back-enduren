import { Injectable } from '@nestjs/common';
import { Repository, MoreThan, IsNull } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { RefreshToken, refreshTokenHash } from '../../../../domain/entities/refresh-token.entity';
import { RefreshTokenRepository } from '../../../../domain/repositories/refresh-token.repository';
import { RefreshTokenTypeormEntity } from '../entities/refresh-token-typeorm.entity';

@Injectable()
export class TypeormRefreshTokenRepository implements RefreshTokenRepository {
  constructor(
    @InjectRepository(RefreshTokenTypeormEntity)
    private readonly ormRepo: Repository<RefreshTokenTypeormEntity>,
  ) {}

  async save(token: RefreshToken): Promise<RefreshToken> {
    const entity = this.toOrm(token);
    const saved = await this.ormRepo.save(entity);
    return this.toDomain(saved);
  }

  async findByToken(token: string): Promise<RefreshToken | null> {
    const entity = await this.ormRepo.findOne({ where: { token: refreshTokenHash(token) } });
    return entity ? this.toDomain(entity) : null;
  }

  async deleteByUserId(userId: string): Promise<void> {
    await this.ormRepo.delete({ userId });
  }

  async deleteByToken(token: string): Promise<void> {
    await this.ormRepo.delete({ token: refreshTokenHash(token) });
  }

  async rotate(previous: RefreshToken, replacement: RefreshToken): Promise<boolean> {
    return this.ormRepo.manager.transaction(async (manager) => {
      const result = await manager.update(RefreshTokenTypeormEntity, {
        id: previous.id,
        token: previous.token,
        usedAt: IsNull(),
        expiresAt: MoreThan(new Date()),
      }, { usedAt: new Date() });
      if (result.affected !== 1) return false;
      await manager.save(RefreshTokenTypeormEntity, this.toOrm(replacement));
      return true;
    });
  }

  private toOrm(token: RefreshToken): RefreshTokenTypeormEntity {
    const entity = new RefreshTokenTypeormEntity();
    entity.id = token.id;
    entity.token = token.token;
    entity.userId = token.userId;
    entity.expiresAt = token.expiresAt;
    entity.createdAt = token.createdAt;
    entity.usedAt = token.usedAt;
    return entity;
  }

  private toDomain(entity: RefreshTokenTypeormEntity): RefreshToken {
    return RefreshToken.reconstitute({
      id: entity.id,
      token: entity.token,
      userId: entity.userId,
      expiresAt: entity.expiresAt,
      createdAt: entity.createdAt,
      usedAt: entity.usedAt,
    });
  }
}
