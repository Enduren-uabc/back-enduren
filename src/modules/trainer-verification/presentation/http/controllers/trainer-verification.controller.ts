import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Param,
  Patch,
  Post,
  Query,
  UploadedFiles,
  UseFilters,
  UseInterceptors,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { Public } from '../../../../auth/presentation/http/decorators/public.decorator';
import { CurrentUser } from '../../../../auth/presentation/http/decorators/current-user.decorator';
import { JwtPayload } from '../../../../auth/presentation/http/strategies/jwt.strategy';
import { CreatePowerspikeDraftUseCase } from '../../../application/use-cases/create-powerspike-draft/create-powerspike-draft.use-case';
import { SubmitPowerspikeVerificationUseCase } from '../../../application/use-cases/submit-powerspike-verification/submit-powerspike-verification.use-case';
import { SubmitTrainerVerificationUseCase } from '../../../application/use-cases/submit-trainer-verification/submit-trainer-verification.use-case';
import { GetMyVerificationStatusUseCase } from '../../../application/use-cases/get-my-verification-status/get-my-verification-status.use-case';
import { ListSpecialtyCatalogUseCase } from '../../../application/use-cases/list-specialty-catalog/list-specialty-catalog.use-case';
import { UpdateTrainerVerificationUseCase } from '../../../application/use-cases/update-trainer-verification/update-trainer-verification.use-case';
import { ListPendingVerificationsUseCase } from '../../../application/use-cases/list-pending-verifications/list-pending-verifications.use-case';
import { GetVerificationDetailUseCase } from '../../../application/use-cases/get-verification-detail/get-verification-detail.use-case';
import { ReviewTrainerVerificationUseCase } from '../../../application/use-cases/review-trainer-verification/review-trainer-verification.use-case';
import { StartVerificationReviewUseCase } from '../../../application/use-cases/start-verification-review/start-verification-review.use-case';
import { UploadPowerspikeCertificateUseCase } from '../../../application/use-cases/upload-powerspike-certificate/upload-powerspike-certificate.use-case';
import { UploadPowerspikeIdDocumentUseCase } from '../../../application/use-cases/upload-powerspike-id-document/upload-powerspike-id-document.use-case';
import {
  TRAINER_FLOW_CONFIG_PORT,
  TrainerFlowConfigPort,
} from '../../../application/ports/trainer-flow-config.port';
import { CurrentActor } from '../../../application/ports/current-actor.port';
import { FlowConfigResponseDto } from '../dtos/flow-config.response';
import { MAX_VERIFICATION_FILE_SIZE_BYTES } from '../../../application/use-cases/trainer-verification-use-case.helpers';
import { SubmitVerificationRequestDto } from '../dtos/submit-verification.request';
import { UpdateVerificationRequestDto } from '../dtos/update-verification.request';
import { ReviewVerificationRequestDto } from '../dtos/review-verification.request';
import {
  TrainerVerificationFiles,
  VerificationStatusResponseDto,
} from '../dtos/verification.response';
import { PowerspikeDraftRequestDto } from '../dtos/powerspike-draft.request';
import { PowerspikeDraftResponseDto } from '../dtos/powerspike-draft.response';
import { PowerspikeUploadCertificateRequestDto } from '../dtos/powerspike-upload-certificate.request';
import { PowerspikeUploadIdRequestDto } from '../dtos/powerspike-upload-id.request';
import { PowerspikeSubmitRequestDto } from '../dtos/powerspike-submit.request';
import { PowerspikeUploadResponseDto } from '../dtos/powerspike-upload.response';
import { StartReviewResponseDto } from '../dtos/start-review.response';
import { ReviewVerificationResponseDto } from '../dtos/review-verification.response';
import { TrainerVerificationErrorFilter } from '../filters/trainer-verification-error.filter';

const VERIFICATION_FILE_INTERCEPTOR = FileFieldsInterceptor(
  [
    { name: 'idDocuments', maxCount: 3 },
    { name: 'certificateDocuments', maxCount: 5 },
  ],
  {
    storage: memoryStorage(),
    limits: { fileSize: MAX_VERIFICATION_FILE_SIZE_BYTES },
  },
);

interface CertificateMetadata {
  name: string;
  issuingOrganization: string;
}

@Controller('trainer-verification')
@UseFilters(TrainerVerificationErrorFilter)
export class TrainerVerificationController {
  constructor(
    private readonly submitUseCase: SubmitTrainerVerificationUseCase,
    private readonly getMyStatusUseCase: GetMyVerificationStatusUseCase,
    private readonly listSpecialtiesUseCase: ListSpecialtyCatalogUseCase,
    private readonly updateUseCase: UpdateTrainerVerificationUseCase,
    private readonly listPendingUseCase: ListPendingVerificationsUseCase,
    private readonly getDetailUseCase: GetVerificationDetailUseCase,
    private readonly reviewUseCase: ReviewTrainerVerificationUseCase,
    private readonly startReviewUseCase: StartVerificationReviewUseCase,
    private readonly createDraftUseCase: CreatePowerspikeDraftUseCase,
    private readonly uploadCertificateUseCase: UploadPowerspikeCertificateUseCase,
    private readonly uploadIdDocumentUseCase: UploadPowerspikeIdDocumentUseCase,
    private readonly submitPowerspikeUseCase: SubmitPowerspikeVerificationUseCase,
    @Inject(TRAINER_FLOW_CONFIG_PORT)
    private readonly flowConfig: TrainerFlowConfigPort,
  ) {}

  @Public()
  @Get('flow-config')
  getFlowConfig(): FlowConfigResponseDto {
    return this.flowConfig.getFlowConfig();
  }

  @Public()
  @Get('specialties')
  async listSpecialties() {
    return this.listSpecialtiesUseCase.execute();
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(VERIFICATION_FILE_INTERCEPTOR)
  async submit(
    @CurrentUser() user: JwtPayload,
    @Body() dto: SubmitVerificationRequestDto,
    @UploadedFiles() files?: TrainerVerificationFiles,
  ): Promise<{ verificationId: string; status: 'pending' }> {
    const idDocumentFiles = files?.idDocuments ?? [];
    const certificateFiles = files?.certificateDocuments ?? [];
    const documentTypes = this.parseStringArray(dto.idDocumentTypes);
    const certificates = this.parseCertificateMetadata(
      dto,
      certificateFiles.length,
    );

    return this.submitUseCase.execute({
      actor: this.toActor(user),
      specialtyKeys: this.parseStringArray(dto.specialtyKeys, true),
      yearsOfExperience: this.parseInteger(dto.yearsOfExperience, true),
      shortBio: this.parseString(dto.shortBio, 'shortBio'),
      idDocumentNumber: this.parseString(
        dto.idDocumentNumber,
        'idDocumentNumber',
      ),
      idDocumentFiles: idDocumentFiles.map((file, index) => ({
        documentType: documentTypes[index] ?? 'other',
        file,
      })),
      certificates: certificateFiles.map((file, index) => ({
        name: certificates[index]?.name ?? '',
        issuingOrganization: certificates[index]?.issuingOrganization ?? '',
        documentFile: file,
      })),
    });
  }

  @Get('my-status')
  async myStatus(
    @CurrentUser() user: JwtPayload,
  ): Promise<VerificationStatusResponseDto> {
    return this.getMyStatusUseCase.execute({ actor: this.toActor(user) });
  }

  @Patch()
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(VERIFICATION_FILE_INTERCEPTOR)
  async update(
    @CurrentUser() user: JwtPayload,
    @Body() dto: UpdateVerificationRequestDto,
    @UploadedFiles() files?: TrainerVerificationFiles,
  ): Promise<{ verificationId: string; status: 'pending' }> {
    const idDocumentFiles = files?.idDocuments;
    const certificateFiles = files?.certificateDocuments;
    const documentTypes = this.parseStringArray(dto.idDocumentTypes);
    const certificates = this.parseCertificateMetadata(
      dto,
      certificateFiles?.length ?? 0,
    );

    return this.updateUseCase.execute({
      actor: this.toActor(user),
      specialtyKeys:
        dto.specialtyKeys === undefined
          ? undefined
          : this.parseStringArray(dto.specialtyKeys, true),
      yearsOfExperience:
        dto.yearsOfExperience === undefined
          ? undefined
          : this.parseInteger(dto.yearsOfExperience, true),
      shortBio:
        dto.shortBio === undefined
          ? undefined
          : this.parseString(dto.shortBio, 'shortBio'),
      idDocumentNumber:
        dto.idDocumentNumber === undefined
          ? undefined
          : this.parseString(dto.idDocumentNumber, 'idDocumentNumber'),
      newIdDocumentFiles: idDocumentFiles?.map((file, index) => ({
        documentType: documentTypes[index] ?? 'other',
        file,
      })),
      newCertificates: certificateFiles?.map((file, index) => ({
        name: certificates[index]?.name ?? '',
        issuingOrganization: certificates[index]?.issuingOrganization ?? '',
        documentFile: file,
      })),
    });
  }

  @Get('pending')
  async listPending(
    @CurrentUser() user: JwtPayload,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.listPendingUseCase.execute({
      actor: this.toActor(user),
      page: page ? this.parsePositiveQueryInt(page, 'page') : undefined,
      limit: limit ? this.parsePositiveQueryInt(limit, 'limit') : undefined,
    });
  }

  @Get(':id')
  async getDetail(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.getDetailUseCase.execute({
      actor: this.toActor(user),
      verificationId: id,
    });
  }

  @Post(':id/start-review')
  @HttpCode(HttpStatus.OK)
  async startReview(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
  ): Promise<StartReviewResponseDto> {
    return this.startReviewUseCase.execute({
      actor: this.toActor(user),
      verificationId: id,
    });
  }

  @Patch(':id/review')
  @HttpCode(HttpStatus.OK)
  async review(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: ReviewVerificationRequestDto,
  ): Promise<ReviewVerificationResponseDto> {
    return this.reviewUseCase.execute({
      actor: this.toActor(user),
      verificationId: id,
      decision: dto.decision,
      rejectionReason: dto.rejectionReason,
      internalComment: dto.internalComment,
      userVisibleMessage: dto.userVisibleMessage,
      correctionType: dto.correctionType,
    });
  }

  @Post('powerspike/draft')
  @HttpCode(HttpStatus.CREATED)
  async createPowerspikeDraft(
    @CurrentUser() user: JwtPayload,
    @Body() dto: PowerspikeDraftRequestDto,
  ): Promise<PowerspikeDraftResponseDto> {
    return this.createDraftUseCase.execute({
      actor: this.toActor(user),
      specialtyKeys: this.parseOptionalStringArray(dto.specialtyKeys),
      yearsOfExperience:
        dto.yearsOfExperience !== undefined
          ? this.parseInteger(dto.yearsOfExperience)
          : undefined,
      shortBio:
        dto.shortBio !== undefined
          ? this.parseString(dto.shortBio, 'shortBio')
          : undefined,
    });
  }

  @Post('powerspike/certificate')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(
    FileFieldsInterceptor([{ name: 'certificateDocument', maxCount: 1 }], {
      storage: memoryStorage(),
      limits: { fileSize: MAX_VERIFICATION_FILE_SIZE_BYTES },
    }),
  )
  async uploadPowerspikeCertificate(
    @CurrentUser() user: JwtPayload,
    @Body() dto: PowerspikeUploadCertificateRequestDto,
    @UploadedFiles() files: { certificateDocument?: Express.Multer.File[] },
  ): Promise<PowerspikeUploadResponseDto> {
    const certificateFile = files?.certificateDocument?.[0];
    if (!certificateFile) {
      throw new BadRequestException('certificateDocument file is required');
    }

    return this.uploadCertificateUseCase.execute({
      actor: this.toActor(user),
      certificateName: this.parseString(dto.certificateName, 'certificateName'),
      issuingOrganization: this.parseString(
        dto.issuingOrganization,
        'issuingOrganization',
      ),
      file: certificateFile,
    });
  }

  @Post('powerspike/id-document')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(
    FileFieldsInterceptor([{ name: 'idDocument', maxCount: 1 }], {
      storage: memoryStorage(),
      limits: { fileSize: MAX_VERIFICATION_FILE_SIZE_BYTES },
    }),
  )
  async uploadPowerspikeIdDocument(
    @CurrentUser() user: JwtPayload,
    @Body() dto: PowerspikeUploadIdRequestDto,
    @UploadedFiles() files: { idDocument?: Express.Multer.File[] },
  ): Promise<PowerspikeUploadResponseDto> {
    const idFile = files?.idDocument?.[0];
    if (!idFile) {
      throw new BadRequestException('idDocument file is required');
    }

    return this.uploadIdDocumentUseCase.execute({
      actor: this.toActor(user),
      idDocumentType: this.parseString(dto.idDocumentType, 'idDocumentType'),
      file: idFile,
    });
  }

  @Post('powerspike/submit')
  @HttpCode(HttpStatus.OK)
  async submitPowerspikeVerification(
    @CurrentUser() user: JwtPayload,
    @Body() dto: PowerspikeSubmitRequestDto,
  ): Promise<{
    verificationId: string;
    advancedStatus: string;
    legacyStatus: string;
  }> {
    return this.submitPowerspikeUseCase.execute({
      actor: this.toActor(user),
      specialtyKeys: this.parseStringArray(dto.specialtyKeys, true),
      yearsOfExperience: this.parseInteger(dto.yearsOfExperience, true),
      shortBio: this.parseString(dto.shortBio, 'shortBio'),
      idDocumentNumber: this.parseString(
        dto.idDocumentNumber,
        'idDocumentNumber',
      ),
    });
  }

  private toActor(user: JwtPayload): CurrentActor {
    return {
      userId: user.sub,
      role: user.role,
    };
  }

  private parseString(value: unknown, fieldName: string): string {
    if (typeof value !== 'string' || !value.trim()) {
      throw new BadRequestException(`${fieldName} is required`);
    }
    return value.trim();
  }

  private parseOptionalStringArray(value: unknown): string[] | undefined {
    if (value === undefined || value === null || value === '') {
      return undefined;
    }
    return this.parseStringArray(value, false);
  }

  private parseStringArray(value: unknown, required = false): string[] {
    if (value === undefined || value === null || value === '') {
      if (required) {
        throw new BadRequestException('Array value is required');
      }
      return [];
    }

    if (Array.isArray(value)) {
      return value.map((item) => String(item).trim()).filter(Boolean);
    }

    if (typeof value !== 'string') {
      throw new BadRequestException('Array value must be a string or array');
    }

    const trimmed = value.trim();
    if (!trimmed) {
      if (required) {
        throw new BadRequestException('Array value is required');
      }
      return [];
    }

    if (trimmed.startsWith('[')) {
      try {
        const parsed = JSON.parse(trimmed) as unknown;
        if (!Array.isArray(parsed)) {
          throw new Error('not array');
        }
        return parsed.map((item) => String(item).trim()).filter(Boolean);
      } catch {
        throw new BadRequestException('Array value contains invalid JSON');
      }
    }

    return trimmed
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  }

  private parseInteger(value: unknown, required = false): number {
    if (value === undefined || value === null || value === '') {
      if (required) {
        throw new BadRequestException('Integer value is required');
      }
      return 0;
    }
    const parsed = Number(value);
    if (!Number.isInteger(parsed)) {
      throw new BadRequestException('Value must be an integer');
    }
    return parsed;
  }

  private parseCertificateMetadata(
    dto: SubmitVerificationRequestDto | UpdateVerificationRequestDto,
    expectedCount: number,
  ): CertificateMetadata[] {
    if (expectedCount === 0) {
      return [];
    }

    if (dto.certificates !== undefined && dto.certificates !== null) {
      if (typeof dto.certificates !== 'string') {
        throw new BadRequestException('certificates must be a JSON string');
      }
      try {
        const parsed = JSON.parse(dto.certificates) as unknown;
        if (!Array.isArray(parsed)) {
          throw new Error('not array');
        }
        return parsed.map((item) => {
          const record = item as Record<string, unknown>;
          return {
            name: String(record.name ?? '').trim(),
            issuingOrganization: String(
              record.issuingOrganization ?? '',
            ).trim(),
          };
        });
      } catch {
        throw new BadRequestException('certificates contains invalid JSON');
      }
    }

    const names = this.parseStringArray(dto.certificateNames);
    const organizations = this.parseStringArray(
      dto.certificateIssuingOrganizations,
    );
    return Array.from({ length: expectedCount }, (_, index) => ({
      name: names[index] ?? '',
      issuingOrganization: organizations[index] ?? '',
    }));
  }

  private parsePositiveQueryInt(value: string, fieldName: string): number {
    const parsed = Number(value);
    if (!Number.isInteger(parsed) || parsed < 1) {
      throw new BadRequestException(`${fieldName} must be a positive integer`);
    }
    return parsed;
  }
}
