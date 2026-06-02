import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
import { ProfileTypeormEntity } from '../../../../../profile/infrastructure/persistence/typeorm/entities/profile-typeorm.entity';
import { UserTypeormEntity } from '../../../../../users/infrastructure/persistence/typeorm/entities/user-typeorm.entity';
import { SpecialtyCatalogEntry } from '../../../../domain/entities/specialty-catalog-entry.entity';
import { TrainerCertificate } from '../../../../domain/entities/trainer-certificate.entity';
import { TrainerIdDocument } from '../../../../domain/entities/trainer-id-document.entity';
import { TrainerVerification } from '../../../../domain/entities/trainer-verification.entity';
import { ExtractedCertificateData } from '../../../../domain/value-objects/extracted-certificate-data.vo';
import { ExtractedIdData } from '../../../../domain/value-objects/extracted-id-data.vo';
import { ScoringResult, RecommendedAction } from '../../../../domain/value-objects/scoring-result.vo';
import { RiskAlert } from '../../../../domain/value-objects/risk-alert.vo';
import { AdvancedVerificationStatus } from '../../../../domain/value-objects/advanced-verification-status.vo';
import { DocumentType } from '../../../../domain/value-objects/document-type.vo';
import { VerificationStatus } from '../../../../domain/value-objects/verification-status.vo';
import { RiskLevel } from '../../../../domain/value-objects/risk-level.vo';
import {
  AlertCode,
  AlertSeverity,
} from '../../../../domain/value-objects/risk-alert.vo';
import {
  TrainerVerificationDetail,
  TrainerVerificationListItem,
  TrainerVerificationRepository,
} from '../../../../domain/repositories/trainer-verification.repository.port';
import { ExtractedCertificateDataTypeormEntity } from '../entities/extracted-certificate-data-typeorm.entity';
import { ExtractedIdDataTypeormEntity } from '../entities/extracted-id-data-typeorm.entity';
import { ScoringResultTypeormEntity } from '../entities/scoring-result-typeorm.entity';
import { SpecialtyCatalogTypeormEntity } from '../entities/specialty-catalog-typeorm.entity';
import { TrainerCertificateTypeormEntity } from '../entities/trainer-certificate-typeorm.entity';
import { TrainerIdDocumentTypeormEntity } from '../entities/trainer-id-document-typeorm.entity';
import { TrainerVerificationSpecialtyTypeormEntity } from '../entities/trainer-verification-specialty-typeorm.entity';
import { TrainerVerificationAdvancedStatusTypeormEntity } from '../entities/trainer-verification-advanced-status-typeorm.entity';
import { TrainerVerificationTypeormEntity } from '../entities/trainer-verification-typeorm.entity';

@Injectable()
export class TypeormTrainerVerificationRepository implements TrainerVerificationRepository {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(TrainerVerificationTypeormEntity)
    private readonly verificationRepo: Repository<TrainerVerificationTypeormEntity>,
    @InjectRepository(UserTypeormEntity)
    private readonly userRepo: Repository<UserTypeormEntity>,
    @InjectRepository(ProfileTypeormEntity)
    private readonly profileRepo: Repository<ProfileTypeormEntity>,
    @InjectRepository(SpecialtyCatalogTypeormEntity)
    private readonly specialtyRepo: Repository<SpecialtyCatalogTypeormEntity>,
  ) {}

  async save(verification: TrainerVerification): Promise<TrainerVerification> {
    await this.dataSource.transaction(async (manager) => {
      await manager
        .getRepository(TrainerVerificationTypeormEntity)
        .save(this.toRootOrm(verification));

      await manager
        .getRepository(TrainerVerificationSpecialtyTypeormEntity)
        .delete({ trainerVerificationId: verification.id });
      await manager
        .getRepository(TrainerIdDocumentTypeormEntity)
        .delete({ trainerVerificationId: verification.id });
      await manager
        .getRepository(TrainerCertificateTypeormEntity)
        .delete({ trainerVerificationId: verification.id });
      await manager
        .getRepository(ExtractedCertificateDataTypeormEntity)
        .delete({ verificationId: verification.id });
      await manager
        .getRepository(ExtractedIdDataTypeormEntity)
        .delete({ verificationId: verification.id });
      await manager
        .getRepository(ScoringResultTypeormEntity)
        .delete({ verificationId: verification.id });
      await manager
        .getRepository(TrainerVerificationAdvancedStatusTypeormEntity)
        .delete({ trainerVerificationId: verification.id });

      const specialtyEntities = verification.specialtyKeys.map(
        (specialtyKey) => {
          const entity = new TrainerVerificationSpecialtyTypeormEntity();
          entity.id = crypto.randomUUID();
          entity.trainerVerificationId = verification.id;
          entity.specialtyKey = specialtyKey;
          return entity;
        },
      );
      if (specialtyEntities.length > 0) {
        await manager
          .getRepository(TrainerVerificationSpecialtyTypeormEntity)
          .save(specialtyEntities);
      }

      const documentEntities = verification.idDocuments.map((document) => {
        const entity = new TrainerIdDocumentTypeormEntity();
        entity.id = document.id;
        entity.trainerVerificationId = verification.id;
        entity.documentType = document.documentType;
        entity.containerName = document.containerName;
        entity.fileUrl = document.fileUrl;
        entity.fileName = document.fileName;
        entity.fileSize = document.fileSize;
        entity.uploadedAt = document.uploadedAt;
        return entity;
      });
      if (documentEntities.length > 0) {
        await manager
          .getRepository(TrainerIdDocumentTypeormEntity)
          .save(documentEntities);
      }

      const certificateEntities = verification.certificates.map(
        (certificate) => {
          const entity = new TrainerCertificateTypeormEntity();
          entity.id = certificate.id;
          entity.trainerVerificationId = verification.id;
          entity.name = certificate.name;
          entity.issuingOrganization = certificate.issuingOrganization;
          entity.containerName = certificate.containerName;
          entity.documentUrl = certificate.documentUrl;
          entity.fileName = certificate.fileName;
          entity.fileSize = certificate.fileSize;
          entity.uploadedAt = certificate.uploadedAt;
          return entity;
        },
      );
      if (certificateEntities.length > 0) {
        await manager
          .getRepository(TrainerCertificateTypeormEntity)
          .save(certificateEntities);
      }

      if (verification.extractedCertificateData) {
        const extractedEntity = new ExtractedCertificateDataTypeormEntity();
        extractedEntity.id = crypto.randomUUID();
        extractedEntity.verificationId = verification.id;
        extractedEntity.fullName =
          verification.extractedCertificateData.fullName;
        extractedEntity.certificateName =
          verification.extractedCertificateData.certificateName;
        extractedEntity.issuingOrganization =
          verification.extractedCertificateData.issuingOrganization;
        extractedEntity.issueDate =
          verification.extractedCertificateData.issueDate ?? null;
        extractedEntity.expirationDate =
          verification.extractedCertificateData.expirationDate ?? null;
        extractedEntity.folioNumber =
          verification.extractedCertificateData.folioNumber ?? null;
        extractedEntity.qrUrl =
          verification.extractedCertificateData.qrUrl ?? null;
        extractedEntity.ocrConfidence =
          verification.extractedCertificateData.ocrConfidence;
        extractedEntity.curp =
          verification.extractedCertificateData.curp ?? null;
        extractedEntity.documentType =
          verification.extractedCertificateData.documentType ?? null;
        extractedEntity.certifyingInstitution =
          verification.extractedCertificateData.certifyingInstitution ?? null;
        extractedEntity.competencyStandardCode =
          verification.extractedCertificateData.competencyStandardCode ?? null;
        extractedEntity.competencyStandardName =
          verification.extractedCertificateData.competencyStandardName ?? null;
        extractedEntity.hasVeracityCode =
          verification.extractedCertificateData.hasVeracityCode ?? null;
        extractedEntity.veracityCode =
          verification.extractedCertificateData.veracityCode ?? null;
        extractedEntity.createdAt = new Date();
        await manager
          .getRepository(ExtractedCertificateDataTypeormEntity)
          .save(extractedEntity);
      }

      if (verification.extractedIdData) {
        const extractedEntity = new ExtractedIdDataTypeormEntity();
        extractedEntity.id = crypto.randomUUID();
        extractedEntity.verificationId = verification.id;
        extractedEntity.fullName = verification.extractedIdData.fullName;
        extractedEntity.documentType =
          verification.extractedIdData.documentType;
        extractedEntity.issuingCountry =
          verification.extractedIdData.issuingCountry ?? null;
        extractedEntity.birthDate =
          verification.extractedIdData.birthDate ?? null;
        extractedEntity.expirationDate =
          verification.extractedIdData.expirationDate ?? null;
        extractedEntity.documentIdentifier =
          verification.extractedIdData.documentIdentifier ?? null;
        extractedEntity.ocrConfidence =
          verification.extractedIdData.ocrConfidence;
        extractedEntity.curp = verification.extractedIdData.curp ?? null;
        extractedEntity.createdAt = new Date();
        await manager
          .getRepository(ExtractedIdDataTypeormEntity)
          .save(extractedEntity);
      }

      if (verification.scoringResult) {
        const scoringEntity = new ScoringResultTypeormEntity();
        scoringEntity.id = crypto.randomUUID();
        scoringEntity.verificationId = verification.id;
        scoringEntity.riskScore = verification.scoringResult.riskScore;
        scoringEntity.riskLevel = verification.scoringResult.riskLevel;
        scoringEntity.recommendedAction =
          verification.scoringResult.recommendedAction;
        scoringEntity.summary = verification.scoringResult.summary;
        scoringEntity.positiveSignals =
          verification.scoringResult.positiveSignals;
        scoringEntity.alerts = verification.scoringResult.alerts.map((a) => ({
          code: a.code,
          severity: a.severity,
          message: a.message,
        }));
        scoringEntity.overrides = verification.scoringResult.overrides;
        scoringEntity.createdAt = new Date();
        await manager
          .getRepository(ScoringResultTypeormEntity)
          .save(scoringEntity);
      }

      if (verification.advancedStatus) {
        const advancedStatusEntity =
          new TrainerVerificationAdvancedStatusTypeormEntity();
        advancedStatusEntity.id = crypto.randomUUID();
        advancedStatusEntity.trainerVerificationId = verification.id;
        advancedStatusEntity.advancedStatus = verification.advancedStatus;
        await manager
          .getRepository(TrainerVerificationAdvancedStatusTypeormEntity)
          .save(advancedStatusEntity);
      }
    });

    const saved = await this.findById(verification.id);
    if (!saved) {
      throw new Error('Trainer verification was not persisted');
    }
    return saved;
  }

  async findById(id: string): Promise<TrainerVerification | null> {
    const entity = await this.verificationRepo.findOne({
      where: { id },
      relations: {
        specialties: true,
        idDocuments: true,
        certificates: true,
        advancedStatus: true,
        extractedCertificateData: true,
        extractedIdData: true,
        scoringResults: true,
      },
    });
    return entity ? this.toDomain(entity) : null;
  }

  async findByUserId(userId: string): Promise<TrainerVerification | null> {
    const entity = await this.verificationRepo.findOne({
      where: { userId },
      relations: {
        specialties: true,
        idDocuments: true,
        certificates: true,
        advancedStatus: true,
        extractedCertificateData: true,
        extractedIdData: true,
        scoringResults: true,
      },
    });
    return entity ? this.toDomain(entity) : null;
  }

  async listPending(
    page: number,
    limit: number,
  ): Promise<{ verifications: TrainerVerificationListItem[]; total: number }> {
    const [entities, total] = await this.verificationRepo.findAndCount({
      where: { verificationStatus: 'pending' },
      relations: { specialties: true },
      order: { createdAt: 'ASC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    const userIds = entities.map((entity) => entity.userId);
    const [users, profiles] = await Promise.all([
      userIds.length > 0
        ? this.userRepo.find({ where: { id: In(userIds) } })
        : Promise.resolve([]),
      userIds.length > 0
        ? this.profileRepo.find({ where: { userId: In(userIds) } })
        : Promise.resolve([]),
    ]);
    const usersById = new Map(users.map((user) => [user.id, user]));
    const profilesByUserId = new Map(
      profiles.map((profile) => [profile.userId, profile]),
    );

    return {
      verifications: entities.map((entity) => ({
        id: entity.id,
        userId: entity.userId,
        username: usersById.get(entity.userId)?.username ?? 'unknown',
        fullName:
          profilesByUserId.get(entity.userId)?.fullName ??
          usersById.get(entity.userId)?.username ??
          'Unknown trainer',
        submittedAt: entity.createdAt,
        specialties: (entity.specialties ?? []).map(
          (specialty) => specialty.specialtyKey,
        ),
      })),
      total,
    };
  }

  async listPendingAdvanced(
    page: number,
    limit: number,
    filter?: {
      riskLevel?: string;
      order?: 'ASC' | 'DESC';
    },
  ): Promise<{ verifications: TrainerVerificationListItem[]; total: number }> {
    const where: any[] = [
      { verificationStatus: 'pending', flowMode: 'legacy' },
      { advancedStatus: { advancedStatus: 'manual_review_pending' } },
      { advancedStatus: { advancedStatus: 'manual_review_in_progress' } },
    ];
    if (filter?.riskLevel) {
      where[1] = {
        advancedStatus: { advancedStatus: 'manual_review_pending' },
        scoringResults: { riskLevel: filter.riskLevel },
      };
      where[2] = {
        advancedStatus: { advancedStatus: 'manual_review_in_progress' },
        scoringResults: { riskLevel: filter.riskLevel },
      };
    }
    const [entities, total] = await this.verificationRepo.findAndCount({
      where,
      relations: {
        specialties: true,
        advancedStatus: true,
        scoringResults: true,
      },
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: filter?.order ?? 'ASC' },
    });

    const userIds = entities.map((entity) => entity.userId);
    const [users, profiles] = await Promise.all([
      userIds.length > 0
        ? this.userRepo.find({ where: { id: In(userIds) } })
        : Promise.resolve([]),
      userIds.length > 0
        ? this.profileRepo.find({ where: { userId: In(userIds) } })
        : Promise.resolve([]),
    ]);
    const usersById = new Map(users.map((user) => [user.id, user]));
    const profilesByUserId = new Map(
      profiles.map((profile) => [profile.userId, profile]),
    );

    return {
      verifications: entities.map((entity) => ({
        id: entity.id,
        userId: entity.userId,
        username: usersById.get(entity.userId)?.username ?? 'unknown',
        fullName:
          profilesByUserId.get(entity.userId)?.fullName ??
          usersById.get(entity.userId)?.username ??
          'Unknown trainer',
        submittedAt: entity.createdAt,
        specialties: (entity.specialties ?? []).map(
          (specialty) => specialty.specialtyKey,
        ),
        advancedStatus: entity.advancedStatus?.advancedStatus ?? 'pending',
        riskLevel: entity.scoringResults?.[0]?.riskLevel ?? undefined,
        riskScore: entity.scoringResults?.[0]?.riskScore ?? undefined,
      })),
      total,
    };
  }

  async findDetailById(id: string): Promise<TrainerVerificationDetail | null> {
    const verification = await this.findById(id);
    if (!verification) {
      return null;
    }

    const [user, profile, specialties] = await Promise.all([
      this.userRepo.findOne({ where: { id: verification.userId } }),
      this.profileRepo.findOne({ where: { userId: verification.userId } }),
      this.specialtyRepo.find({
        where: { key: In(verification.specialtyKeys) },
      }),
    ]);

    const entity = await this.verificationRepo.findOne({
      where: { id },
      relations: {
        advancedStatus: true,
        statusHistory: true,
        auditEvents: true,
        extractedCertificateData: true,
        extractedIdData: true,
        scoringResults: true,
      },
    });

    const statusHistory = this.mapStatusHistory(entity);
    const auditEvents = this.mapAuditEvents(entity);
    const extractedCertData = this.mapExtractedCertificateData(verification);
    const extractedIdData = this.mapExtractedIdData(verification);
    const scoringResult = this.mapScoringResult(verification);

    return {
      id: verification.id,
      userId: verification.userId,
      username: user?.username ?? 'unknown',
      fullName: profile?.fullName ?? user?.username ?? 'Unknown trainer',
      status: verification.verificationStatus,
      specialties: specialties.map((specialty) =>
        SpecialtyCatalogEntry.reconstitute({
          key: specialty.key,
          displayName: specialty.displayName,
          category: specialty.category,
          iconUrl: specialty.iconUrl,
          createdAt: specialty.createdAt,
        }),
      ),
      yearsOfExperience: verification.yearsOfExperience,
      shortBio: verification.shortBio,
      idDocumentNumber: verification.idDocumentNumber,
      idDocuments: verification.idDocuments.map((document) => ({
        id: document.id,
        documentType: document.documentType,
        containerName: document.containerName,
        fileUrl: document.fileUrl,
        fileName: document.fileName,
        fileSize: document.fileSize,
      })),
      certificates: verification.certificates.map((certificate) => ({
        id: certificate.id,
        name: certificate.name,
        issuingOrganization: certificate.issuingOrganization,
        containerName: certificate.containerName,
        documentUrl: certificate.documentUrl,
        fileName: certificate.fileName,
        fileSize: certificate.fileSize,
      })),
      rejectionReason: verification.rejectionReason,
      verifiedBy: verification.verifiedBy,
      verifiedAt: verification.verifiedAt ?? null,
      createdAt: verification.createdAt,
      updatedAt: verification.updatedAt,
      assignedReviewerId: verification.assignedReviewerId,
      advancedStatus: verification.advancedStatus,
      extractedCertificateData: extractedCertData,
      extractedIdData: extractedIdData,
      scoringResult,
      statusHistory,
      auditEvents,
    };
  }

  private mapStatusHistory(
    entity: TrainerVerificationTypeormEntity | null,
  ): Array<{
    id: string;
    fromStatus: string | null;
    toStatus: string;
    actorId: string;
    actorType: string;
    reason: string | undefined;
    createdAt: string;
  }> {
    return (
      entity?.statusHistory?.map((h) => ({
        id: h.id,
        fromStatus: h.previousStatus ?? null,
        toStatus: h.newStatus,
        actorId: h.actorId,
        actorType: h.actorType,
        reason: h.reason ?? undefined,
        createdAt: h.createdAt.toISOString(),
      })) ?? []
    );
  }

  private mapAuditEvents(
    entity: TrainerVerificationTypeormEntity | null,
  ): Array<{
    id: string;
    eventType: string;
    actorId: string;
    actorType: string;
    description: string;
    metadata: Record<string, unknown> | undefined;
    createdAt: string;
  }> {
    return (
      entity?.auditEvents?.map((e) => ({
        id: e.id,
        eventType: e.eventType,
        actorId: e.actorId,
        actorType: e.actorType,
        description: e.description,
        metadata: (e.metadata as Record<string, unknown>) ?? undefined,
        createdAt: e.createdAt.toISOString(),
      })) ?? []
    );
  }

  private mapExtractedCertificateData(verification: TrainerVerification): {
    fullName: string;
    certificateName: string;
    issuingOrganization: string;
    issueDate?: string;
    expirationDate?: string;
    folioNumber?: string;
    qrUrl?: string;
    ocrConfidence: number;
    hasVeracityCode?: boolean;
    veracityCode?: string;
  } | null {
    if (!verification.extractedCertificateData) {
      return null;
    }
    const cert = verification.extractedCertificateData;
    return {
      fullName: cert.fullName,
      certificateName: cert.certificateName,
      issuingOrganization: cert.issuingOrganization,
      issueDate: cert.issueDate ? cert.issueDate.toISOString() : undefined,
      expirationDate: cert.expirationDate
        ? cert.expirationDate.toISOString()
        : undefined,
      folioNumber: cert.folioNumber ?? undefined,
      qrUrl: cert.qrUrl ?? undefined,
      ocrConfidence: cert.ocrConfidence,
      hasVeracityCode: cert.hasVeracityCode ?? undefined,
      veracityCode: cert.veracityCode ?? undefined,
    };
  }

  private mapExtractedIdData(verification: TrainerVerification): {
    fullName: string;
    documentType: string;
    issuingCountry?: string;
    birthDate?: string;
    expirationDate?: string;
    documentIdentifier?: string;
    ocrConfidence: number;
  } | null {
    if (!verification.extractedIdData) {
      return null;
    }
    const idData = verification.extractedIdData;
    const rawDocId = idData.documentIdentifier;
    return {
      fullName: idData.fullName,
      documentType: idData.documentType,
      issuingCountry: idData.issuingCountry ?? undefined,
      birthDate: idData.birthDate ? idData.birthDate.toISOString() : undefined,
      expirationDate: idData.expirationDate
        ? idData.expirationDate.toISOString()
        : undefined,
      documentIdentifier: this.maskDocumentId(rawDocId),
      ocrConfidence: idData.ocrConfidence,
    };
  }

  private mapScoringResult(verification: TrainerVerification): {
    riskScore: number;
    riskLevel: string;
    recommendedAction: string;
    summary: string;
    positiveSignals: string[];
    alerts: { code: string; severity: string; message: string }[];
    overrides: string[];
  } | null {
    if (!verification.scoringResult) {
      return null;
    }
    const sr = verification.scoringResult;
    return {
      riskScore: sr.riskScore,
      riskLevel: sr.riskLevel,
      recommendedAction: sr.recommendedAction,
      summary: sr.summary,
      positiveSignals: sr.positiveSignals,
      alerts: sr.alerts.map((a) => ({
        code: a.code,
        severity: a.severity,
        message: a.message,
      })),
      overrides: sr.overrides,
    };
  }

  private toRootOrm(
    verification: TrainerVerification,
  ): TrainerVerificationTypeormEntity {
    const entity = new TrainerVerificationTypeormEntity();
    entity.id = verification.id;
    entity.userId = verification.userId;
    entity.verificationStatus = verification.verificationStatus;
    entity.yearsOfExperience = verification.yearsOfExperience;
    entity.shortBio = verification.shortBio;
    entity.idDocumentNumber = verification.idDocumentNumber;
    entity.rejectionReason = verification.rejectionReason;
    entity.verifiedBy = verification.verifiedBy;
    entity.verifiedAt = verification.verifiedAt as Date;
    entity.assignedReviewerId = verification.assignedReviewerId ?? null;
    entity.flowMode = verification.flowMode;
    entity.createdAt = verification.createdAt;
    entity.updatedAt = verification.updatedAt;
    return entity;
  }

  private maskDocumentId(
    rawDocId: string | undefined | null,
  ): string | undefined {
    if (!rawDocId) return undefined;
    if (rawDocId.length > 8) {
      return rawDocId.slice(0, 4) + '****' + rawDocId.slice(-4);
    }
    return '****';
  }

  private toDomain(
    entity: TrainerVerificationTypeormEntity,
  ): TrainerVerification {
    const advancedStatus = entity.advancedStatus?.advancedStatus
      ? (entity.advancedStatus.advancedStatus as AdvancedVerificationStatus)
      : undefined;

    const extractedCertData = entity.extractedCertificateData?.[0];
    const extractedId = entity.extractedIdData?.[0];
    const scoringData = entity.scoringResults?.[0];

    return TrainerVerification.reconstitute({
      id: entity.id,
      userId: entity.userId,
      verificationStatus: entity.verificationStatus as VerificationStatus,
      specialtyKeys: (entity.specialties ?? []).map(
        (specialty) => specialty.specialtyKey,
      ),
      yearsOfExperience: entity.yearsOfExperience,
      shortBio: entity.shortBio,
      idDocumentNumber: entity.idDocumentNumber,
      idDocuments: (entity.idDocuments ?? []).map((document) =>
        TrainerIdDocument.reconstitute({
          id: document.id,
          documentType: document.documentType as DocumentType,
          containerName: document.containerName,
          fileUrl: document.fileUrl,
          fileName: document.fileName,
          fileSize: document.fileSize,
          uploadedAt: document.uploadedAt,
        }),
      ),
      certificates: (entity.certificates ?? []).map((certificate) =>
        TrainerCertificate.reconstitute({
          id: certificate.id,
          name: certificate.name,
          issuingOrganization: certificate.issuingOrganization,
          containerName: certificate.containerName,
          documentUrl: certificate.documentUrl,
          fileName: certificate.fileName,
          fileSize: certificate.fileSize,
          uploadedAt: certificate.uploadedAt,
        }),
      ),
      rejectionReason: entity.rejectionReason,
      verifiedBy: entity.verifiedBy,
      verifiedAt: entity.verifiedAt ?? null,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
      advancedStatus,
      statusHistory: [],
      extractedCertificateData: extractedCertData
        ? ExtractedCertificateData.reconstitute({
            fullName: extractedCertData.fullName,
            certificateName: extractedCertData.certificateName,
            issuingOrganization: extractedCertData.issuingOrganization,
            issueDate: extractedCertData.issueDate
              ? new Date(extractedCertData.issueDate)
              : undefined,
            expirationDate: extractedCertData.expirationDate
              ? new Date(extractedCertData.expirationDate)
              : undefined,
            folioNumber: extractedCertData.folioNumber ?? undefined,
            qrUrl: extractedCertData.qrUrl ?? undefined,
            ocrConfidence: extractedCertData.ocrConfidence,
            curp: extractedCertData.curp ?? undefined,
            documentType: extractedCertData.documentType ?? undefined,
            certifyingInstitution:
              extractedCertData.certifyingInstitution ?? undefined,
            competencyStandardCode:
              extractedCertData.competencyStandardCode ?? undefined,
            competencyStandardName:
              extractedCertData.competencyStandardName ?? undefined,
            hasVeracityCode: extractedCertData.hasVeracityCode ?? undefined,
            veracityCode: extractedCertData.veracityCode ?? undefined,
          })
        : null,
      extractedIdData: extractedId
        ? ExtractedIdData.reconstitute({
            fullName: extractedId.fullName,
            documentType: extractedId.documentType,
            issuingCountry: extractedId.issuingCountry ?? undefined,
            birthDate: extractedId.birthDate
              ? new Date(extractedId.birthDate)
              : undefined,
            expirationDate: extractedId.expirationDate
              ? new Date(extractedId.expirationDate)
              : undefined,
            documentIdentifier: extractedId.documentIdentifier ?? undefined,
            ocrConfidence: extractedId.ocrConfidence,
            curp: extractedId.curp ?? undefined,
          })
        : null,
      scoringResult: scoringData
        ? ScoringResult.reconstitute({
            riskScore: scoringData.riskScore,
            riskLevel: scoringData.riskLevel as RiskLevel,
            recommendedAction:
              scoringData.recommendedAction as RecommendedAction,
            summary: scoringData.summary,
            positiveSignals: scoringData.positiveSignals ?? [],
            alerts: (
              (scoringData.alerts as {
                code: AlertCode;
                severity: AlertSeverity;
                message: string;
              }[]) ?? []
            ).map((a) =>
              RiskAlert.reconstitute({
                code: a.code,
                severity: a.severity,
                message: a.message,
              }),
            ),
            overrides: scoringData.overrides ?? [],
          })
        : null,
      assignedReviewerId: entity.assignedReviewerId ?? null,
      flowMode: (entity.flowMode as 'legacy' | 'powerspike') ?? 'legacy',
    });
  }
}
