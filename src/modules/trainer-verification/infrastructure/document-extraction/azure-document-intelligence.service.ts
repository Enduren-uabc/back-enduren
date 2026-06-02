import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  DocumentAnalysisClient,
  AzureKeyCredential,
} from '@azure/ai-form-recognizer';
import {
  DocumentExtractionPort,
  ExtractionResult,
} from '../../application/ports/document-extraction.port';
import { ExtractedCertificateData } from '../../domain/value-objects/extracted-certificate-data.vo';
import { ExtractedIdData } from '../../domain/value-objects/extracted-id-data.vo';

const QUERY_FIELDS = [
  'documentType',
  'holderFullName',
  'curp',
  'certificateFolio',
  'issuingAuthority',
  'certifyingInstitution',
  'competencyStandardCode',
  'competencyStandardName',
  'issueDate',
  'expirationDate',
];

@Injectable()
export class AzureDocumentIntelligenceService implements DocumentExtractionPort {
  private readonly client: DocumentAnalysisClient;
  private readonly endpoint: string;
  private readonly key: string;

  constructor(configService: ConfigService) {
    this.endpoint = configService.getOrThrow<string>(
      'AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT',
    );
    this.key = configService.getOrThrow<string>(
      'AZURE_DOCUMENT_INTELLIGENCE_KEY',
    );
    this.client = new DocumentAnalysisClient(
      this.endpoint,
      new AzureKeyCredential(this.key),
    );
  }

  async extractCertificate(
    buffer: Buffer,
    _mimeType: string,
    _originalName: string,
  ): Promise<ExtractionResult<ExtractedCertificateData>> {
    try {
      const poller = await this.client.beginAnalyzeDocument(
        'prebuilt-layout',
        buffer,
      );
      const result = await poller.pollUntilDone();

      if (!result) {
        return {
          success: false,
          error: {
            code: 'technical_failure',
            message: 'Azure returned empty result',
          },
        };
      }

      const layoutData = this.parseCertificateFromLayout(result);
      const qfResult = await this.analyzeWithQueryFields(buffer);

      if (qfResult.success && qfResult.data) {
        const merged = this.mergeCertificateData(layoutData, qfResult.data);
        return { success: true, data: merged };
      }

      return { success: true, data: layoutData };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'technical_failure',
          message:
            error instanceof Error ? error.message : 'Unknown Azure error',
        },
      };
    }
  }

  private mergeCertificateData(
    layout: ExtractedCertificateData,
    queryFields: ExtractedCertificateData,
  ): ExtractedCertificateData {
    const isValid = (s: string | undefined | null): boolean =>
      !!s && s.length >= 5 && !s.includes('|') && !s.includes('  ');

    return ExtractedCertificateData.create({
      fullName: isValid(layout.fullName)
        ? layout.fullName
        : queryFields.fullName,
      certificateName:
        layout.certificateName !== 'Unknown Certificate'
          ? layout.certificateName
          : queryFields.certificateName,
      issuingOrganization:
        layout.issuingOrganization !== 'Unknown Organization'
          ? layout.issuingOrganization
          : queryFields.issuingOrganization,
      issueDate: layout.issueDate ?? queryFields.issueDate,
      expirationDate: layout.expirationDate ?? queryFields.expirationDate,
      folioNumber: layout.folioNumber ?? queryFields.folioNumber,
      qrUrl: layout.qrUrl ?? queryFields.qrUrl,
      ocrConfidence: Math.max(layout.ocrConfidence, queryFields.ocrConfidence),
      curp: layout.curp ?? queryFields.curp,
      documentType: layout.documentType ?? queryFields.documentType,
      certifyingInstitution:
        layout.certifyingInstitution ?? queryFields.certifyingInstitution,
      competencyStandardCode:
        layout.competencyStandardCode ?? queryFields.competencyStandardCode,
      competencyStandardName:
        layout.competencyStandardName ?? queryFields.competencyStandardName,
    });
  }

  async extractIdDocument(
    buffer: Buffer,
    _mimeType: string,
    _originalName: string,
  ): Promise<ExtractionResult<ExtractedIdData>> {
    try {
      const poller = await this.client.beginAnalyzeDocument(
        'prebuilt-idDocument',
        buffer,
      );
      const result = await poller.pollUntilDone();

      if (!result || !result.documents || result.documents.length === 0) {
        return {
          success: false,
          error: {
            code: 'unreadable_document',
            message: 'No identity document detected',
          },
        };
      }

      const doc = result.documents[0];
      const fields = doc.fields ?? {};
      const content: string = result.content ?? '';

      const getField = (name: string): DocumentField | undefined => {
        return fields[name];
      };

      const firstName = getField('FirstName');
      const lastName = getField('LastName');
      const docType = getField('DocumentType');
      const country = getField('CountryRegion');
      const birthDate = getField('DateOfBirth');
      const expirationDate = getField('DateOfExpiration');
      const docNumber = getField('DocumentNumber');

      let fullName = [
        this.extractStringValue(firstName),
        this.extractStringValue(lastName),
      ]
        .filter(Boolean)
        .join(' ')
        .trim();

      if (!fullName || fullName.length < 5) {
        const nameMatch = content.match(/NOMBRE[\s:]*([A-Z\s]{5,60})/i);
        if (nameMatch && nameMatch[1]) {
          fullName = nameMatch[1].trim();
        }
      }

      if (!fullName) {
        return {
          success: false,
          error: {
            code: 'unreadable_document',
            message: 'Could not extract full name from ID',
          },
        };
      }

      const documentType = this.extractStringValue(docType) || 'other';

      let extractedExpirationDate = this.extractDateValue(expirationDate);

      if (!extractedExpirationDate) {
        const yearRanges = content.matchAll(/(\d{4})\s*[-–]\s*(\d{4})/g);
        let lastEndYear: number | null = null;
        for (const match of yearRanges) {
          lastEndYear = parseInt(match[2], 10);
        }
        if (lastEndYear) {
          extractedExpirationDate = new Date(lastEndYear, 11, 31);
        }
      }

      if (!extractedExpirationDate) {
        const dateMatch = content.match(/(\d{1,2})[-/](\d{1,2})[-/](\d{4})/);
        if (dateMatch) {
          const [, day, month, year] = dateMatch;
          const yearNum = parseInt(year);
          if (yearNum > 2024) {
            extractedExpirationDate = new Date(
              yearNum,
              parseInt(month) - 1,
              parseInt(day),
            );
          }
        }
      }

      const curp =
        this.extractByRegex(content, [
          /CURP[\s\S]*?([A-Z]{4}\d{6}[A-Z]{6}\d{2})/i,
          /([A-Z]{4}\d{6}[A-Z]{6}\d{2})/i,
        ]) ?? undefined;

      const confidences: number[] = [];
      const addConf = (f: DocumentField | undefined) => {
        if (f?.confidence !== undefined) confidences.push(f.confidence);
      };
      addConf(firstName);
      addConf(lastName);
      addConf(docType);
      addConf(country);
      addConf(birthDate);
      addConf(expirationDate);
      addConf(docNumber);

      const ocrConfidence =
        confidences.length > 0
          ? confidences.reduce((a, b) => a + b, 0) / confidences.length
          : 0.5;

      const data = ExtractedIdData.create({
        fullName,
        documentType: this.normalizeDocumentType(documentType),
        issuingCountry: this.extractStringValue(country) || undefined,
        birthDate: this.extractDateValue(birthDate) || undefined,
        expirationDate: extractedExpirationDate,
        documentIdentifier: this.extractStringValue(docNumber) || undefined,
        ocrConfidence,
        curp,
      });

      return { success: true, data };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'technical_failure',
          message:
            error instanceof Error ? error.message : 'Unknown Azure error',
        },
      };
    }
  }

  private async analyzeWithQueryFields(
    buffer: Buffer,
  ): Promise<ExtractionResult<ExtractedCertificateData>> {
    const submitUrl = `${this.endpoint.replace(/\/+$/, '')}/formrecognizer/documentModels/prebuilt-layout:analyze?api-version=2024-11-30`;

    const base64Source = buffer.toString('base64');
    const payload = {
      base64Source,
      features: ['queryFields'] as string[],
      queryFields: QUERY_FIELDS,
    };

    const submitResponse = await fetch(submitUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Ocp-Apim-Subscription-Key': this.key,
      },
      body: JSON.stringify(payload),
    });

    if (!submitResponse.ok) {
      const errorText = await submitResponse.text().catch(() => 'Unknown');
      return {
        success: false,
        error: {
          code: 'technical_failure',
          message: `Azure submit failed (${submitResponse.status}): ${errorText}`,
        },
      };
    }

    const operationLocation = submitResponse.headers.get('Operation-Location');
    if (!operationLocation) {
      return {
        success: false,
        error: {
          code: 'technical_failure',
          message: 'No Operation-Location header in Azure response',
        },
      };
    }

    const pollResult = await this.pollForResult(operationLocation);
    if (!pollResult.success || !pollResult.data) {
      return {
        success: false,
        error: pollResult.error ?? {
          code: 'technical_failure',
          message: 'Azure analysis failed',
        },
      };
    }

    const analyzeResult = pollResult.data;
    const content: string = analyzeResult.content ?? '';
    const queryDocs = analyzeResult.documents ?? [];
    const fields =
      queryDocs.length > 0 && queryDocs[0].fields ? queryDocs[0].fields : {};

    return this.buildExtractedData(fields, content);
  }

  private async pollForResult(
    operationLocation: string,
  ): Promise<ExtractionResult<{ content: string; documents: any[] }>> {
    const maxRetries = 60;
    for (let i = 0; i < maxRetries; i++) {
      const pollResponse = await fetch(operationLocation, {
        headers: { 'Ocp-Apim-Subscription-Key': this.key },
      });

      if (!pollResponse.ok) {
        return {
          success: false,
          error: {
            code: 'technical_failure',
            message: `Azure poll failed (${pollResponse.status})`,
          },
        };
      }

      const body: any = await pollResponse.json();

      if (body.status === 'succeeded') {
        return {
          success: true,
          data: body.analyzeResult ?? { content: '', documents: [] },
        };
      }

      if (body.status === 'failed') {
        return {
          success: false,
          error: {
            code: 'unreadable_document',
            message: 'Azure analysis failed',
          },
        };
      }

      await new Promise((r) => setTimeout(r, 1000));
    }

    return {
      success: false,
      error: {
        code: 'technical_failure',
        message: 'Azure analysis timed out',
      },
    };
  }

  private buildExtractedData(
    fields: Record<string, any>,
    content: string,
  ): ExtractionResult<ExtractedCertificateData> {
    const getFieldStr = (name: string): string | undefined => {
      const field = fields[name];
      if (!field) return undefined;
      const confidence = field.confidence;
      if (confidence !== undefined && confidence < 0.5) return undefined;
      return field.valueString ?? field.valueDate ?? field.content ?? undefined;
    };

    const getFieldDate = (name: string): string | undefined => {
      const field = fields[name];
      if (!field) return undefined;
      const confidence = field.confidence;
      if (confidence !== undefined && confidence < 0.5) return undefined;
      return field.valueDate ?? field.content ?? field.valueString ?? undefined;
    };

    const holderFullName = getFieldStr('holderFullName');
    const rawCurp = getFieldStr('curp');
    const rawCompetencyStandardCode = getFieldStr('competencyStandardCode');
    const rawCertificateFolio = getFieldStr('certificateFolio');
    const rawIssuingAuthority = getFieldStr('issuingAuthority');
    const rawCertifyingInstitution = getFieldStr('certifyingInstitution');
    const rawCompetencyStandardName = getFieldStr('competencyStandardName');
    const rawIssueDate = getFieldDate('issueDate');
    const rawExpirationDate = getFieldDate('expirationDate');
    const rawDocumentType = getFieldStr('documentType');

    const curp = rawCurp || rawCompetencyStandardCode || undefined;
    const competencyStandardCode = this.extractByRegex(content, [
      /(EC\d{4,5})/i,
    ]);
    const competencyStandardName =
      rawCompetencyStandardName ??
      this.extractByRegex(content, [
        /(?:Estándar\s+de\s+Competencia\s*\n?\s*)(EC\d{4,5}\s+[A-Za-zÀ-ÿ\s,]+?)(?:\n|$)/i,
        /EC\d{4,5}\s+([A-Za-zÀ-ÿ\s,áéíóúüñ]+(?:\s+de\s+[a-z]+)*)/i,
        /(Acondicionamiento\s+físico\s+de\s+jóvenes\s+y\s+adultos\s+para\s+el\s+mantenimiento\s+de\s+la\s+salud)/i,
      ]) ??
      undefined;

    const fullName =
      holderFullName &&
      holderFullName.length >= 5 &&
      !holderFullName.includes('|')
        ? holderFullName
        : (this.extractByRegex(content, [
            /(?:Nombre|Name|Nombre\s+Completo|Full\s+Name|Student\s+Name)[:\s\n]*([^\n]{2,60})/i,
            /Otorga\s+el\s+presente[\s\na]+([A-Z][A-Z\s]{5,60})/i,
            /Certificado\s+a[:\s\n]*([A-Z][A-Z\s]{5,60})/i,
            /a[:\s\n]+([A-Z][A-Z\s]{5,60})(?:\s+con|\s+por|\s+nivel|$)/i,
          ]) ?? 'Unknown');

    const certificateName =
      competencyStandardName ??
      this.extractByRegex(content, [
        /(Acondicionamiento\s+físico[^.\n]{0,100})/i,
        /(EC\d{4,5}[^.\n]{0,50})/i,
      ]) ??
      'Unknown Certificate';

    const issuingOrganization =
      rawIssuingAuthority ??
      this.extractByRegex(content, [
        /(CONOCER[^.\n]{0,30})/i,
        /(SEP[\s\n]*SECRETARIA[^.\n]{0,50})/i,
      ]) ??
      'Unknown Organization';

    const certifyingInstitution =
      rawCertifyingInstitution ??
      this.extractByRegex(content, [
        /(ICEM[\s\n]*INSTITUTO\s+DE\s+CERTIFICACIÓN[\s\n]*EMPRESARIAL[\s\n]*DE[\s\n]*MÉXICO)/i,
        /(ICEM[\s\n]*INSTITUTO\s+DE\s+CERTIFICACION[\s\n]*EMPRESARIAL[\s\n]*DE[\s\n]*MEXICO)/i,
        /(INSTITUTO\s+DE\s+CERTIFICACIÓN\s+EMPRESARIAL\s+DE\s+MÉXICO)/i,
      ]) ??
      undefined;

    const folioNumber =
      rawCertificateFolio ??
      this.extractByRegex(content, [
        /Folio\s+CONOCER[\s:]*([A-Z0-9-]{5,})/i,
        /(D-\d{10,}-E\d{2}-\d{4})/i,
      ]) ??
      undefined;

    const qrUrl =
      this.extractByRegex(content, [
        /(https?:\/\/[^\s]{10,})/i,
        /(www\.conocer\.gob\.mx[^\s]*)/i,
        /(conocer\.gob\.mx[^\s]*)/i,
      ]) ?? undefined;

    const issueDate =
      this.tryParseDate(
        rawIssueDate ??
          this.extractByRegex(content, [
            /(?:Issue\s+Date|Date\s+Issued|Fecha\s+de\s+[Ee]misi[oó]n)[:\s]*([0-9]{1,4}[-/][0-9]{1,2}[-/][0-9]{1,4})/i,
            /(\d{1,2}\s+de\s+(?:enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)\s+de\s+\d{4})/i,
          ]),
      ) ?? undefined;

    const expirationDate =
      this.tryParseDate(
        rawExpirationDate ??
          this.extractByRegex(content, [
            /(?:Expiration|Expiry|Valid\s+Until|Vigencia|Vence|Expiration\s+Date|Fecha\s+de\s+expiraci[oó]n)[:\s]*([0-9]{1,4}[-/][0-9]{1,2}[-/][0-9]{1,4})/i,
            /(\d{1,2}\s+de\s+(?:enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)\s+de\s+\d{4})/i,
          ]),
      ) ?? undefined;

    const confidenceValues: number[] = Object.values(fields)
      .map((f: any) => f.confidence)
      .filter((c: any) => typeof c === 'number');
    const ocrConfidence =
      confidenceValues.length > 0
        ? confidenceValues.reduce((a, b) => a + b, 0) / confidenceValues.length
        : 0.85;

    return {
      success: true,
      data: ExtractedCertificateData.create({
        fullName,
        certificateName,
        issuingOrganization,
        issueDate,
        expirationDate,
        folioNumber,
        qrUrl,
        ocrConfidence,
        curp,
        documentType: rawDocumentType ?? 'certificate',
        certifyingInstitution,
        competencyStandardCode: competencyStandardCode ?? undefined,
        competencyStandardName,
      }),
    };
  }

  private parseCertificateFromLayout(result: any): ExtractedCertificateData {
    const keyValuePairs = result.keyValuePairs ?? [];
    const content: string = result.content ?? '';

    const fieldMap = this.extractFromKeyValuePairs(keyValuePairs);

    const fullName =
      fieldMap.get('fullName') ??
      this.extractByRegex(content, [
        /(?:Nombre|Name|Nombre\s+Completo|Full\s+Name|Student\s+Name)[:\s\n]*([^\n]{2,60})/i,
        /Otorga\s+el\s+presente[\s\na]+([A-Z][A-Z\s]{5,60})/i,
        /Certificado\s+a[:\s\n]*([A-Z][A-Z\s]{5,60})/i,
        /a[:\s\n]+([A-Z][A-Z\s]{5,60})(?:\s+con|\s+por|\s+nivel|$)/i,
      ]) ??
      'Unknown';

    const certificateName =
      fieldMap.get('certificateName') ??
      this.extractByRegex(content, [
        /(?:Certificaci[oó]n|Certificado|Certificate|Course|Curso|Certification\s+Name|T[ií]tulo)[:\s]*([^\n]{2,100})/i,
        /(EC\d{4,5}[^.\n]{0,50})/i,
        /(Acondicionamiento\s+f[ií]sico[^.\n]{0,100})/i,
        /(Estandar\s+de\s+Competencia[^.\n]{0,50})/i,
      ]) ??
      'Unknown Certificate';

    const issuingOrganization =
      fieldMap.get('issuingOrganization') ??
      this.extractByRegex(content, [
        /(?:Instituci[oó]n|Institution|Issuing|Organization|Entidad\s+Emisora|Issuing\s+Organization)[:\s]*([^\n]{2,100})/i,
        /(ICEM[\s\n]*INSTITUTO\s+DE\s+CERTIFICACION[^.\n]{0,50})/i,
        /(CONOCER[^.\n]{0,30})/i,
        /(SEP[\s\n]*SECRETARIA[^.\n]{0,50})/i,
        /(INSTITUTO\s+DE\s+CERTIFICACION[^.\n]{0,50})/i,
      ]) ??
      'Unknown Organization';

    const folioNumber =
      fieldMap.get('folioNumber') ??
      this.extractByRegex(content, [
        /(?:Folio|N[uú]mero|No\.?\s*|ID|Credential|Certificate\s+Number|Credential\s+ID)[:\s]*([^\n]{2,50})/i,
        /Folio\s+CONOCER[\s:]*([A-Z0-9-]{5,})/i,
        /(D-\d{10,}-E\d{2}-\d{4})/i,
      ]) ??
      undefined;

    const qrUrl =
      fieldMap.get('qrUrl') ??
      this.extractByRegex(content, [
        /(?:QR|URL|Verify\s+at|Verification\s+URL)[:\s]*([^\s]{10,})/i,
        /(https?:\/\/[^\s]{10,})/i,
        /(www\.conocer\.gob\.mx[^\s]*)/i,
        /(conocer\.gob\.mx[^\s]*)/i,
      ]) ??
      undefined;

    const issueDateStr =
      fieldMap.get('issueDate') ??
      this.extractByRegex(content, [
        /(?:Issue\s+Date|Date\s+Issued|Fecha\s+de\s+[Ee]misi[oó]n|Fecha\s+de\s+emisi[oó]n)[:\s]*([0-9]{1,4}[-/][0-9]{1,2}[-/][0-9]{1,4})/i,
        /(\d{1,2}\s+de\s+(?:enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)\s+de\s+\d{4})/i,
      ]);

    const expirationDateStr =
      fieldMap.get('expirationDate') ??
      this.extractByRegex(content, [
        /(?:Expiration|Expiry|Valid\s+Until|Vigencia|Vence|Expiration\s+Date|Fecha\s+de\s+expiraci[oó]n)[:\s]*([0-9]{1,4}[-/][0-9]{1,2}[-/][0-9]{1,4})/i,
        /(\d{1,2}\s+de\s+(?:enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)\s+de\s+\d{4})/i,
      ]);

    const curp = this.extractByRegex(content, [
      /(?:CURP|Clave[^:]*)[:\s]*([A-Z]{4}\d{6}[A-Z]{6}\d{2})/i,
      /([A-Z]{4}\d{6}[A-Z]{6}\d{2})/i,
    ]);

    const competencyStandardCode = this.extractByRegex(content, [
      /(EC\d{4,5})/i,
    ]);

    const competencyStandardName = this.extractByRegex(content, [
      /(?:Estándar\s+de\s+Competencia\s*\n?\s*)(EC\d{4,5}\s+[A-Za-zÀ-ÿ\s,]+?)(?:\n|$)/i,
      /EC\d{4,5}\s+([A-Za-zÀ-ÿ\s,áéíóúüñ]+)/i,
      /(Acondicionamiento\s+físico[^.\n]{0,100})/i,
    ]);

    const certifyingInstitution = this.extractByRegex(content, [
      /(ICEM[\s\n]*INSTITUTO\s+DE\s+CERTIFICACIÓN[\s\n]*EMPRESARIAL[\s\n]*DE[\s\n]*MÉXICO)/i,
      /(ICEM[\s\n]*INSTITUTO\s+DE\s+CERTIFICACION[\s\n]*EMPRESARIAL[\s\n]*DE[\s\n]*MEXICO)/i,
      /(INSTITUTO\s+DE\s+CERTIFICACIÓN\s+EMPRESARIAL\s+DE\s+MÉXICO)/i,
    ]);

    const confidenceValues: number[] = keyValuePairs
      .map((kv: any) => kv.confidence)
      .filter(Boolean);
    const ocrConfidence =
      confidenceValues.length > 0
        ? confidenceValues.reduce((a: number, b: number) => a + b, 0) /
          confidenceValues.length
        : 0.85;

    return ExtractedCertificateData.create({
      fullName,
      certificateName,
      issuingOrganization,
      issueDate: issueDateStr ? this.tryParseDate(issueDateStr) : undefined,
      expirationDate: expirationDateStr
        ? this.tryParseDate(expirationDateStr)
        : undefined,
      folioNumber: folioNumber || undefined,
      qrUrl: qrUrl || undefined,
      ocrConfidence,
      curp: curp || undefined,
      documentType: 'certificate',
      certifyingInstitution: certifyingInstitution || undefined,
      competencyStandardCode: competencyStandardCode || undefined,
      competencyStandardName: competencyStandardName || undefined,
    });
  }

  private extractFromKeyValuePairs(pairs: any[]): Map<string, string> {
    const map = new Map<string, string>();

    const keyMap: Record<string, string[]> = {
      fullName: [
        'nombre',
        'name',
        'full name',
        'nombre completo',
        'student name',
        'complete name',
        'nombre del titular',
        'otorga el presente a',
        'certificado a',
      ],
      certificateName: [
        'certificacion',
        'certificate',
        'certification',
        'course',
        'curso',
        'certification name',
        'certificate name',
        'estandar de competencia',
        'ec',
        'competencia',
      ],
      issuingOrganization: [
        'institucion',
        'institution',
        'issuing organization',
        'organization',
        'entidad emisora',
        'issuing org',
        'sep',
        'conocer',
        'icem',
        'secretaria de educacion',
      ],
      issueDate: [
        'fecha de emision',
        'issue date',
        'date issued',
        'fecha emision',
        'emission date',
        'fecha de emisión',
      ],
      expirationDate: [
        'fecha de expiracion',
        'expiration date',
        'expiry date',
        'valid until',
        'vigencia',
        'expiration',
        'fecha de expiración',
        'vence',
        'valido hasta',
      ],
      folioNumber: [
        'folio',
        'numero',
        'number',
        'certificate number',
        'credential id',
        'credential number',
        'id number',
        'folio conocer',
        'numero de certificado',
      ],
      qrUrl: [
        'qr',
        'url',
        'verify at',
        'verification url',
        'qr url',
        'conocer.gob.mx',
      ],
    };

    for (const pair of pairs) {
      const keyContent = (pair.key?.content ?? '').toLowerCase().trim();
      const valueContent = pair.value?.content?.trim();
      if (!keyContent || !valueContent) continue;

      for (const [fieldKey, aliases] of Object.entries(keyMap)) {
        if (map.has(fieldKey)) continue;
        if (aliases.some((alias) => keyContent.includes(alias))) {
          map.set(fieldKey, valueContent);
          break;
        }
      }
    }

    return map;
  }

  private extractByRegex(content: string, patterns: RegExp[]): string | null {
    for (const regex of patterns) {
      const match = content.match(regex);
      if (match && match[1]?.trim()) {
        return match[1].trim();
      }
    }
    return null;
  }

  private tryParseDate(value: string | null | undefined): Date | undefined {
    if (!value) return undefined;
    const months: Record<string, number> = {
      enero: 0,
      febrero: 1,
      marzo: 2,
      abril: 3,
      mayo: 4,
      junio: 5,
      julio: 6,
      agosto: 7,
      septiembre: 8,
      octubre: 9,
      noviembre: 10,
      diciembre: 11,
    };

    const spanishDateMatch = value.match(
      /(\d{1,2})\s+de\s+(\w+)\s+de\s+(\d{4})/i,
    );
    if (spanishDateMatch) {
      const [, day, monthStr, year] = spanishDateMatch;
      const month = months[monthStr.toLowerCase()];
      if (month !== undefined) {
        const parsed = new Date(parseInt(year), month, parseInt(day));
        if (!isNaN(parsed.getTime())) return parsed;
      }
    }

    const parsed = new Date(value);
    return isNaN(parsed.getTime()) ? undefined : parsed;
  }

  private extractStringValue(
    field: DocumentField | undefined,
  ): string | undefined {
    if (!field || field.kind !== 'string') return undefined;
    return (field as any).value;
  }

  private extractDateValue(field: DocumentField | undefined): Date | undefined {
    if (!field || field.kind !== 'date') return undefined;
    return (field as any).value;
  }

  private normalizeDocumentType(raw: string): string {
    const lower = raw.toLowerCase();
    if (lower.includes('passport')) return 'passport';
    if (
      lower.includes('driver') ||
      lower.includes('license') ||
      lower.includes('licencia')
    )
      return 'driver_license';
    if (
      lower.includes('ine') ||
      lower.includes('identidad') ||
      lower.includes('id card') ||
      lower.includes('national id')
    )
      return 'ine';
    return 'other';
  }
}

interface DocumentField {
  kind?: string;
  value?: unknown;
  content?: string;
  confidence?: number;
}
