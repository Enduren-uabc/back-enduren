import { TrainerLinkRequest } from '../../domain/entities/trainer-link-request.entity';
import { LinkRequestStatus } from '../../domain/value-objects/link-status.vo';
import { TrainerLinkRequestTypeormEntity } from '../persistence/typeorm/entities/trainer-link-request-typeorm.entity';

export class TrainerLinkRequestMapper {
  public static toDomain(
    orm: TrainerLinkRequestTypeormEntity,
  ): TrainerLinkRequest {
    return TrainerLinkRequest.reconstitute({
      id: orm.id,
      clientId: orm.clientId,
      trainerId: orm.trainerId,
      status: orm.status as LinkRequestStatus,
      message: orm.message,
      rejectionReason: orm.rejectionReason,
      cancelledAt: orm.cancelledAt,
      respondedAt: orm.respondedAt,
      respondedById: orm.respondedById,
      createdAt: orm.createdAt,
      updatedAt: orm.updatedAt,
    });
  }

  public static toOrm(
    domain: TrainerLinkRequest,
  ): TrainerLinkRequestTypeormEntity {
    const orm = new TrainerLinkRequestTypeormEntity();
    orm.id = domain.id;
    orm.clientId = domain.clientId;
    orm.trainerId = domain.trainerId;
    orm.status = domain.status;
    orm.message = domain.message;
    orm.rejectionReason = domain.rejectionReason;
    orm.cancelledAt = domain.cancelledAt;
    orm.respondedAt = domain.respondedAt;
    orm.respondedById = domain.respondedById;
    orm.createdAt = domain.createdAt;
    orm.updatedAt = domain.updatedAt;
    return orm;
  }
}
