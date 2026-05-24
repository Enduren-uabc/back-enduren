import { PushToken, type Platform } from '../../domain/entities/push-token.entity';
import { PushTokenTypeormEntity } from '../persistence/typeorm/entities/push-token-typeorm.entity';

export class PushTokenMapper {
  public static toDomain(orm: PushTokenTypeormEntity): PushToken {
    return PushToken.reconstitute({
      id: orm.id,
      userId: orm.userId,
      token: orm.token,
      platform: orm.platform as Platform,
      createdAt: orm.createdAt,
      updatedAt: orm.updatedAt,
    });
  }

  public static toOrm(domain: PushToken): PushTokenTypeormEntity {
    const orm = new PushTokenTypeormEntity();
    orm.id = domain.id;
    orm.userId = domain.userId;
    orm.token = domain.token;
    orm.platform = domain.platform;
    orm.createdAt = domain.createdAt;
    orm.updatedAt = domain.updatedAt;
    return orm;
  }
}
