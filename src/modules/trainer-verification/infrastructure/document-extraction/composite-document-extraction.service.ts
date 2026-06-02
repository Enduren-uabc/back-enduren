import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  DocumentExtractionPort,
  ExtractionResult,
} from '../../application/ports/document-extraction.port';
import { ExtractedCertificateData } from '../../domain/value-objects/extracted-certificate-data.vo';
import { ExtractedIdData } from '../../domain/value-objects/extracted-id-data.vo';
import { AzureDocumentIntelligenceService } from './azure-document-intelligence.service';
import { OpenAIDocumentExtractor } from './openai-document-extractor.service';

@Injectable()
export class CompositeDocumentExtractionService implements DocumentExtractionPort {
  private readonly strategy: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly azureService: AzureDocumentIntelligenceService,
    private readonly openaiService: OpenAIDocumentExtractor,
  ) {
    this.strategy = this.configService.get<string>(
      'DOCUMENT_EXTRACTION_STRATEGY',
      'di_primary',
    );
  }

  async extractCertificate(
    buffer: Buffer,
    mimeType: string,
    originalName: string,
  ): Promise<ExtractionResult<ExtractedCertificateData>> {
    if (this.strategy === 'openai_only') {
      return this.openaiService.extractCertificate(
        buffer,
        mimeType,
        originalName,
      );
    }

    if (this.strategy === 'openai_primary') {
      return this.extractWithFallback(
        () =>
          this.openaiService.extractCertificate(buffer, mimeType, originalName),
        () =>
          this.azureService.extractCertificate(buffer, mimeType, originalName),
        this.isCertificateSufficient,
        this.mergeCertificateData.bind(this),
      );
    }

    // di_primary (default) o cualquier otro valor
    return this.extractWithFallback(
      () =>
        this.azureService.extractCertificate(buffer, mimeType, originalName),
      () =>
        this.openaiService.extractCertificate(buffer, mimeType, originalName),
      this.isCertificateSufficient,
      this.mergeCertificateData.bind(this),
    );
  }

  async extractIdDocument(
    buffer: Buffer,
    mimeType: string,
    originalName: string,
  ): Promise<ExtractionResult<ExtractedIdData>> {
    if (this.strategy === 'openai_only') {
      return this.openaiService.extractIdDocument(
        buffer,
        mimeType,
        originalName,
      );
    }

    if (this.strategy === 'openai_primary') {
      return this.extractWithFallback(
        () =>
          this.openaiService.extractIdDocument(buffer, mimeType, originalName),
        () =>
          this.azureService.extractIdDocument(buffer, mimeType, originalName),
        this.isIdSufficient,
        this.mergeIdData.bind(this),
      );
    }

    // di_primary (default) o cualquier otro valor
    return this.extractWithFallback(
      () => this.azureService.extractIdDocument(buffer, mimeType, originalName),
      () =>
        this.openaiService.extractIdDocument(buffer, mimeType, originalName),
      this.isIdSufficient,
      this.mergeIdData.bind(this),
    );
  }

  private async extractWithFallback<T>(
    primaryFn: () => Promise<ExtractionResult<T>>,
    fallbackFn: () => Promise<ExtractionResult<T>>,
    isSufficient: (data: T) => boolean,
    mergeFn: (primary: T, fallback: T) => T,
  ): Promise<ExtractionResult<T>> {
    const primaryResult = await primaryFn();

    if (
      primaryResult.success &&
      primaryResult.data &&
      isSufficient(primaryResult.data)
    ) {
      return primaryResult;
    }

    const fallbackResult = await fallbackFn();

    if (fallbackResult.success && fallbackResult.data) {
      if (primaryResult.success && primaryResult.data) {
        return {
          success: true,
          data: mergeFn(primaryResult.data, fallbackResult.data),
        };
      }
      return fallbackResult;
    }

    return primaryResult;
  }

  private isCertificateSufficient(data: ExtractedCertificateData): boolean {
    const hasName = !!data.fullName && data.fullName.length >= 5;
    const hasKeyField =
      !!data.folioNumber || !!data.competencyStandardCode || !!data.curp;
    const confidenceOk = data.ocrConfidence >= 0.4;
    return hasName && hasKeyField && confidenceOk;
  }

  private isIdSufficient(data: ExtractedIdData): boolean {
    const hasName = !!data.fullName && data.fullName.length >= 5;
    const hasCurp = !!data.curp && data.curp.length === 18;
    const confidenceOk = data.ocrConfidence >= 0.4;
    return hasName && hasCurp && confidenceOk;
  }

  private mergeCertificateData(
    di: ExtractedCertificateData,
    openai: ExtractedCertificateData,
  ): ExtractedCertificateData {
    const pick = <T>(
      diVal: T | undefined,
      aiVal: T | undefined,
    ): T | undefined => {
      if (
        diVal !== undefined &&
        diVal !== null &&
        diVal !== '' &&
        diVal !== 'Unknown' &&
        diVal !== 'Unknown Certificate' &&
        diVal !== 'Unknown Organization'
      ) {
        return diVal;
      }
      return aiVal;
    };

    return ExtractedCertificateData.create({
      fullName: pick(di.fullName, openai.fullName) ?? 'Unknown',
      certificateName:
        pick(di.certificateName, openai.certificateName) ??
        'Unknown Certificate',
      issuingOrganization:
        pick(di.issuingOrganization, openai.issuingOrganization) ??
        'Unknown Organization',
      issueDate: di.issueDate ?? openai.issueDate,
      expirationDate: di.expirationDate ?? openai.expirationDate,
      folioNumber: pick(di.folioNumber, openai.folioNumber),
      qrUrl: pick(di.qrUrl, openai.qrUrl),
      ocrConfidence: Math.max(di.ocrConfidence, openai.ocrConfidence),
      curp: pick(di.curp, openai.curp),
      documentType: pick(di.documentType, openai.documentType) ?? 'certificate',
      certifyingInstitution: pick(
        di.certifyingInstitution,
        openai.certifyingInstitution,
      ),
      competencyStandardCode: pick(
        di.competencyStandardCode,
        openai.competencyStandardCode,
      ),
      competencyStandardName: pick(
        di.competencyStandardName,
        openai.competencyStandardName,
      ),
    });
  }

  private mergeIdData(
    di: ExtractedIdData,
    openai: ExtractedIdData,
  ): ExtractedIdData {
    const pick = <T>(
      diVal: T | undefined,
      aiVal: T | undefined,
    ): T | undefined => {
      if (
        diVal !== undefined &&
        diVal !== null &&
        diVal !== '' &&
        diVal !== 'Unknown'
      ) {
        return diVal;
      }
      return aiVal;
    };

    return ExtractedIdData.create({
      fullName: pick(di.fullName, openai.fullName) ?? 'Unknown',
      documentType: pick(di.documentType, openai.documentType) ?? 'other',
      issuingCountry: pick(di.issuingCountry, openai.issuingCountry),
      birthDate: di.birthDate ?? openai.birthDate,
      expirationDate: di.expirationDate ?? openai.expirationDate,
      documentIdentifier: pick(
        di.documentIdentifier,
        openai.documentIdentifier,
      ),
      ocrConfidence: Math.max(di.ocrConfidence, openai.ocrConfidence),
      curp: pick(di.curp, openai.curp),
    });
  }
}
