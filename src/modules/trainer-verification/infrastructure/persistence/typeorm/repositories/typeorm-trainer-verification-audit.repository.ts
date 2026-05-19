import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TrainerVerificationAuditEvent } from '../../../../domain/entities/trainer-verification-audit-event.entity';
import { TrainerVerificationStatusChange } from '../../../../domain/entities/trainer-verification-status-change.entity';
import { TrainerVerificationAuditRepository } from '../../../../domain/repositories/trainer-verification-audit.repository.port';
import { TrainerVerificationAuditEventTypeormEntity } from '../entities/trainer-verification-audit-event-typeorm.entity';
import { TrainerVerificationStatusHistoryTypeormEntity } from '../entities/trainer-verification-status-history-typeorm.entity';

@Injectable()
export class TypeormTrainerVerificationAuditRepository implements TrainerVerificationAuditRepository {
  constructor(
    @InjectRepository(TrainerVerificationStatusHistoryTypeormEntity)
    private readonly statusHistoryRepo: Repository<TrainerVerificationStatusHistoryTypeormEntity>,
    @InjectRepository(TrainerVerificationAuditEventTypeormEntity)
    private readonly auditEventRepo: Repository<TrainerVerificationAuditEventTypeormEntity>,
  ) {}

  async recordStatusChange(
    change: TrainerVerificationStatusChange,
  ): Promise<void> {
    const entity = new TrainerVerificationStatusHistoryTypeormEntity();
    entity.id = change.id;
    entity.trainerVerificationId = change.verificationId;
    entity.previousStatus = change.previousStatus;
    entity.newStatus = change.newStatus;
    entity.actorId = change.actorId;
    entity.actorType = change.actorType;
    entity.reason = change.reason ?? null;
    entity.metadata = change.metadata ?? null;
    entity.createdAt = change.createdAt;
    await this.statusHistoryRepo.save(entity);
  }

  async recordAuditEvent(event: TrainerVerificationAuditEvent): Promise<void> {
    const entity = new TrainerVerificationAuditEventTypeormEntity();
    entity.id = event.id;
    entity.trainerVerificationId = event.verificationId;
    entity.eventType = event.eventType;
    entity.actorId = event.actorId;
    entity.actorType = event.actorType;
    entity.description = event.description;
    entity.metadata = event.metadata ?? null;
    entity.createdAt = event.createdAt;
    await this.auditEventRepo.save(entity);
  }

  async getStatusHistory(
    verificationId: string,
  ): Promise<TrainerVerificationStatusChange[]> {
    const entities = await this.statusHistoryRepo.find({
      where: { trainerVerificationId: verificationId },
      order: { createdAt: 'DESC' },
    });

    return entities.map((entity) =>
      TrainerVerificationStatusChange.reconstitute({
        id: entity.id,
        verificationId: entity.trainerVerificationId,
        previousStatus: entity.previousStatus as
          | import('../../../../domain/value-objects/advanced-verification-status.vo').AdvancedVerificationStatus
          | null,
        newStatus:
          entity.newStatus as import('../../../../domain/value-objects/advanced-verification-status.vo').AdvancedVerificationStatus,
        actorId: entity.actorId,
        actorType: entity.actorType as
          | 'user'
          | 'system'
          | 'admin'
          | 'external_service',
        reason: entity.reason ?? undefined,
        metadata: entity.metadata ?? undefined,
        createdAt: entity.createdAt,
      }),
    );
  }

  async getAuditEvents(
    verificationId: string,
    eventType?: string,
  ): Promise<TrainerVerificationAuditEvent[]> {
    const where: Record<string, unknown> = {
      trainerVerificationId: verificationId,
    };
    if (eventType) {
      where.eventType = eventType;
    }

    const entities = await this.auditEventRepo.find({
      where,
      order: { createdAt: 'DESC' },
    });

    return entities.map((entity) =>
      TrainerVerificationAuditEvent.reconstitute({
        id: entity.id,
        verificationId: entity.trainerVerificationId,
        eventType:
          entity.eventType as TrainerVerificationAuditEvent['eventType'],
        actorId: entity.actorId,
        actorType: entity.actorType as
          | 'user'
          | 'system'
          | 'admin'
          | 'external_service',
        description: entity.description,
        metadata: entity.metadata ?? undefined,
        createdAt: entity.createdAt,
      }),
    );
  }
}
