import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
import { ProfileTypeormEntity } from '../../../../../profile/infrastructure/persistence/typeorm/entities/profile-typeorm.entity';
import { UserTypeormEntity } from '../../../../../users/infrastructure/persistence/typeorm/entities/user-typeorm.entity';
import { SpecialtyCatalogEntry } from '../../../../domain/entities/specialty-catalog-entry.entity';
import { TrainerCertificate } from '../../../../domain/entities/trainer-certificate.entity';
import { TrainerIdDocument } from '../../../../domain/entities/trainer-id-document.entity';
import { TrainerVerification } from '../../../../domain/entities/trainer-verification.entity';
import { DocumentType } from '../../../../domain/value-objects/document-type.vo';
import { VerificationStatus } from '../../../../domain/value-objects/verification-status.vo';
import {
  TrainerVerificationDetail,
  TrainerVerificationListItem,
  TrainerVerificationRepository,
} from '../../../../domain/repositories/trainer-verification.repository.port';
import { SpecialtyCatalogTypeormEntity } from '../entities/specialty-catalog-typeorm.entity';
import { TrainerCertificateTypeormEntity } from '../entities/trainer-certificate-typeorm.entity';
import { TrainerIdDocumentTypeormEntity } from '../entities/trainer-id-document-typeorm.entity';
import { TrainerVerificationSpecialtyTypeormEntity } from '../entities/trainer-verification-specialty-typeorm.entity';
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
        fileUrl: document.fileUrl,
        fileName: document.fileName,
        fileSize: document.fileSize,
      })),
      certificates: verification.certificates.map((certificate) => ({
        id: certificate.id,
        name: certificate.name,
        issuingOrganization: certificate.issuingOrganization,
        documentUrl: certificate.documentUrl,
        fileName: certificate.fileName,
        fileSize: certificate.fileSize,
      })),
      rejectionReason: verification.rejectionReason,
      verifiedBy: verification.verifiedBy,
      verifiedAt: verification.verifiedAt ?? null,
      createdAt: verification.createdAt,
      updatedAt: verification.updatedAt,
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
    entity.createdAt = verification.createdAt;
    entity.updatedAt = verification.updatedAt;
    return entity;
  }

  private toDomain(
    entity: TrainerVerificationTypeormEntity,
  ): TrainerVerification {
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
    });
  }
}
