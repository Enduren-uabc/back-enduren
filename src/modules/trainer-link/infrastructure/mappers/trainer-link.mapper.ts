import { TrainerLink } from '../../domain/entities/trainer-link.entity';
import { LinkStatus } from '../../domain/value-objects/link-status.vo';
import { TrainerLinkTypeormEntity } from '../persistence/typeorm/entities/trainer-link-typeorm.entity';

export class TrainerLinkMapper {
  public static toDomain(orm: TrainerLinkTypeormEntity): TrainerLink {
    return TrainerLink.reconstitute({
      id: orm.id,
      clientId: orm.clientId,
      trainerId: orm.trainerId,
      linkRequestId: orm.linkRequestId,
      status: orm.status as LinkStatus,
      activatedAt: orm.activatedAt,
      deactivatedAt: orm.deactivatedAt,
      deactivationReason: orm.deactivationReason,
      createdAt: orm.createdAt,
      updatedAt: orm.updatedAt,
    });
  }

  public static toOrm(domain: TrainerLink): TrainerLinkTypeormEntity {
    const orm = new TrainerLinkTypeormEntity();
    orm.id = domain.id;
    orm.clientId = domain.clientId;
    orm.trainerId = domain.trainerId;
    orm.linkRequestId = domain.linkRequestId;
    orm.status = domain.status;
    orm.activatedAt = domain.activatedAt;
    orm.deactivatedAt = domain.deactivatedAt;
    orm.deactivationReason = domain.deactivationReason;
    orm.createdAt = domain.createdAt;
    orm.updatedAt = domain.updatedAt;
    return orm;
  }
}
