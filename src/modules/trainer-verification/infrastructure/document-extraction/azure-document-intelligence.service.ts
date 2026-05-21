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

interface FieldMatch {
  value: string;
  confidence: number;
}

@Injectable()
export class AzureDocumentIntelligenceService implements DocumentExtractionPort {
  private readonly client: DocumentAnalysisClient;

  constructor(configService: ConfigService) {
    const endpoint = configService.getOrThrow<string>(
      'AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT',
    );
    const key = configService.getOrThrow<string>(
      'AZURE_DOCUMENT_INTELLIGENCE_KEY',
    );
    this.client = new DocumentAnalysisClient(
      endpoint,
      new AzureKeyCredential(key),
    );
  }

  async extractCertificate(
    buffer: Buffer,
    mimeType: string,
    _originalName: string,
  ): Promise<ExtractionResult<ExtractedCertificateData>> {
    try {
      void mimeType;
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

      const extracted = this.parseCertificateFromLayout(result);
      return { success: true, data: extracted };
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

  async extractIdDocument(
    buffer: Buffer,
    mimeType: string,
    _originalName: string,
  ): Promise<ExtractionResult<ExtractedIdData>> {
    try {
      void mimeType;
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

      // Para INE mexicana, intentar extraer el nombre completo del contenido raw
      let fullName = [
        this.extractStringValue(firstName),
        this.extractStringValue(lastName),
      ]
        .filter(Boolean)
        .join(' ')
        .trim();

      // Si no se pudo extraer el nombre de los campos estructurados, buscar en el contenido
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

      // Mejorar extracción de fecha de expiración para INE mexicana
      let extractedExpirationDate = this.extractDateValue(expirationDate);

      // Si no hay fecha de expiración estructurada, buscar en el contenido
      if (!extractedExpirationDate) {
        // Buscar patrones de vigencia mexicanos: "VIGENCIA 2020-2030" o "VIGENCIA 2020 - 2030" o "VIGENCIA 2020 2030"
        const vigenciaMatch = content.match(
          /VIGENCIA[:\s]*(\d{4})\s*[-–\s]+\s*(\d{4})/i,
        );
        if (vigenciaMatch && vigenciaMatch[2]) {
          const yearEnd = parseInt(vigenciaMatch[2], 10);
          // La INE mexicana típicamente expira el 31 de diciembre del año final
          extractedExpirationDate = new Date(yearEnd, 11, 31);
        }

        // Buscar formato "VIGENCIA AÑO INICIO - AÑO FIN" con más flexibilidad
        if (!extractedExpirationDate) {
          const vigenciaAltMatch = content.match(
            /VIGENCIA[:\s]+(\d{4})\s+(?:A\s+)?[:\s]*(\d{4})/i,
          );
          if (vigenciaAltMatch && vigenciaAltMatch[2]) {
            const yearEnd = parseInt(vigenciaAltMatch[2], 10);
            extractedExpirationDate = new Date(yearEnd, 11, 31);
          }
        }

        // También buscar fechas completas en formato DD/MM/YYYY o DD-MM-YYYY
        if (!extractedExpirationDate) {
          const dateMatch = content.match(/(\d{1,2})[-/](\d{1,2})[-/](\d{4})/);
          if (dateMatch) {
            const [, day, month, year] = dateMatch;
            // Validar que sea una fecha futura razonable (después de 2024)
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

        // Buscar solo año de expiración si aparece después de "VIGENCIA" o "HASTA"
        if (!extractedExpirationDate) {
          const yearMatch = content.match(
            /(?:VIGENCIA|HASTA|VENCE)[:\s]+\d{4}[-\s]+(\d{4})/i,
          );
          if (yearMatch && yearMatch[1]) {
            const yearEnd = parseInt(yearMatch[1], 10);
            extractedExpirationDate = new Date(yearEnd, 11, 31);
          }
        }
      }

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

  private parseCertificateFromLayout(result: any): ExtractedCertificateData {
    const keyValuePairs = result.keyValuePairs ?? [];
    const content: string = result.content ?? '';
    const tables = result.tables ?? [];

    const fieldMap = this.extractFromKeyValuePairs(keyValuePairs);

    const fullName =
      fieldMap.get('fullName') ??
      this.extractByRegex(content, [
        /(?:Nombre|Name|Nombre\s+Completo|Full\s+Name|Student\s+Name)[:\s\n]*([^\n]{2,60})/i,
        /Otorga\s+el\s+presente[\s\na]+([A-Z][A-Z\s]{5,60})/i,
        /Certificado\s+a[:\s\n]*([A-Z][A-Z\s]{5,60})/i,
        /a[:\s\n]+([A-Z][A-Z\s]{5,60})(?:\s+con|\s+por|\s+nivel|$)/i,
      ]);

    const certificateName =
      fieldMap.get('certificateName') ??
      this.extractByRegex(content, [
        /(?:Certificaci[oó]n|Certificado|Certificate|Course|Curso|Certification\s+Name|T[ií]tulo)[:\s]*([^\n]{2,100})/i,
        /(EC\d{4,5}[^.\n]{0,50})/i,
        /(Acondicionamiento\s+f[ií]sico[^.\n]{0,100})/i,
        /(Estandar\s+de\s+Competencia[^.\n]{0,50})/i,
      ]);

    const issuingOrganization =
      fieldMap.get('issuingOrganization') ??
      this.extractByRegex(content, [
        /(?:Instituci[oó]n|Institution|Issuing|Organization|Entidad\s+Emisora|Issuing\s+Organization)[:\s]*([^\n]{2,100})/i,
        /(ICEM[\s\n]*INSTITUTO\s+DE\s+CERTIFICACION[^.\n]{0,50})/i,
        /(CONOCER[^.\n]{0,30})/i,
        /(SEP[\s\n]*SECRETARIA[^.\n]{0,50})/i,
        /(INSTITUTO\s+DE\s+CERTIFICACION[^.\n]{0,50})/i,
      ]);

    const folioNumber =
      fieldMap.get('folioNumber') ??
      this.extractByRegex(content, [
        /(?:Folio|N[uú]mero|No\.?\s*|ID|Credential|Certificate\s+Number|Credential\s+ID)[:\s]*([^\n]{2,50})/i,
        /Folio\s+CONOCER[\s:]*([A-Z0-9-]{5,})/i,
        /(D-\d{10,}-E\d{2}-\d{4})/i,
      ]);

    const qrUrl =
      fieldMap.get('qrUrl') ??
      this.extractByRegex(content, [
        /(?:QR|URL|Verify\s+at|Verification\s+URL)[:\s]*([^\s]{10,})/i,
        /(https?:\/\/[^\s]{10,})/i,
        /(www\.conocer\.gob\.mx[^\s]*)/i,
        /(conocer\.gob\.mx[^\s]*)/i,
      ]);

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

    const confidenceValues: number[] = keyValuePairs
      .map((kv: any) => kv.confidence)
      .filter(Boolean);
    const ocrConfidence =
      confidenceValues.length > 0
        ? confidenceValues.reduce((a: number, b: number) => a + b, 0) /
          confidenceValues.length
        : 0.85;

    const result_fullName = fullName || 'Unknown';
    const result_certificateName = certificateName || 'Unknown Certificate';
    const result_issuingOrg = issuingOrganization || 'Unknown Organization';

    return ExtractedCertificateData.create({
      fullName: result_fullName,
      certificateName: result_certificateName,
      issuingOrganization: result_issuingOrg,
      issueDate: issueDateStr ? this.tryParseDate(issueDateStr) : undefined,
      expirationDate: expirationDateStr
        ? this.tryParseDate(expirationDateStr)
        : undefined,
      folioNumber: folioNumber || undefined,
      qrUrl: qrUrl || undefined,
      ocrConfidence,
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

  private tryParseDate(value: string): Date | undefined {
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
