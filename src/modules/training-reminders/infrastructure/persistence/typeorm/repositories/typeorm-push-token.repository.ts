import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PushToken } from '../../../../domain/entities/push-token.entity';
import { PushTokenRepository } from '../../../../domain/repositories/push-token.repository.port';
import { PushTokenTypeormEntity } from '../entities/push-token-typeorm.entity';
import { PushTokenMapper } from '../../../mappers/push-token.mapper';

@Injectable()
export class TypeormPushTokenRepository implements PushTokenRepository {
  constructor(
    @InjectRepository(PushTokenTypeormEntity)
    private readonly ormRepo: Repository<PushTokenTypeormEntity>,
  ) {}

  public async findByUserId(userId: string): Promise<PushToken[]> {
    const orms = await this.ormRepo.find({ where: { userId } });
    return orms.map(PushTokenMapper.toDomain);
  }

  public async save(token: PushToken): Promise<PushToken> {
    const orm = PushTokenMapper.toOrm(token);
    const saved = await this.ormRepo.save(orm);
    return PushTokenMapper.toDomain(saved);
  }

  public async deleteByToken(token: string): Promise<void> {
    await this.ormRepo.delete({ token });
  }
}
