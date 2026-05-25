import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  DocumentExtractionPort,
  ExtractionResult,
} from '../../application/ports/document-extraction.port';
import { ExtractedCertificateData } from '../../domain/value-objects/extracted-certificate-data.vo';
import { ExtractedIdData } from '../../domain/value-objects/extracted-id-data.vo';

@Injectable()
export class OpenAIDocumentExtractor implements DocumentExtractionPort {
  private readonly endpoint: string;
  private readonly apiKey: string;
  private readonly deploymentName: string;
  private readonly apiVersion: string;
  private readonly enabled: boolean;

  constructor(configService: ConfigService) {
    this.endpoint = configService.get<string>('AZURE_OPENAI_ENDPOINT', '');
    this.apiKey = configService.get<string>('AZURE_OPENAI_API_KEY', '');
    this.deploymentName = configService.get<string>(
      'AZURE_OPENAI_DEPLOYMENT_NAME',
      'gpt-4o',
    );
    this.apiVersion = configService.get<string>(
      'AZURE_OPENAI_API_VERSION',
      '2024-12-01-preview',
    );
    this.enabled =
      configService.get<string>('AZURE_OPENAI_ENABLED', 'false') === 'true';
  }

  async extractCertificate(
    buffer: Buffer,
    mimeType: string,
    _originalName: string,
  ): Promise<ExtractionResult<ExtractedCertificateData>> {
    if (!this.enabled || !this.apiKey) {
      return {
        success: false,
        error: {
          code: 'technical_failure',
          message: 'Azure OpenAI fallback not enabled or not configured',
        },
      };
    }

    const base64Image = buffer.toString('base64');
    const imageUrl = `data:${mimeType};base64,${base64Image}`;

    const prompt = `Eres un extractor especializado de certificados oficiales mexicanos emitidos por CONOCER/SEP.

Tu tarea es analizar la imagen de un certificado y devolver ÚNICAMENTE un objeto JSON válido con estos campos:
- fullName: nombre completo del titular (string)
- curp: Clave Única de Registro de Población (string, 18 caracteres alfanuméricos) o null
- folioNumber: folio del certificado (string) o null
- certificateName: nombre del estándar de competencia o certificación (string) o null
- issueDate: fecha de emisión en formato ISO 8601 (YYYY-MM-DD) o null
- expirationDate: fecha de expiración en formato ISO 8601 (YYYY-MM-DD) o null
- issuingOrganization: organización que otorga (ej: CONOCER, SEP) (string) o null
- certifyingInstitution: institución certificadora (ej: ICEM) (string) o null
- competencyStandardCode: código del estándar (ej: EC0474) (string) o null
- competencyStandardName: nombre completo del estándar de competencia (string) o null
- qrUrl: URL de verificación o QR detectado (string) o null

REGLAS IMPORTANTES:
1. Ignora COMPLETAMENTE cualquier marca de agua, texto de prueba, o sello que diga "INVALIDO", "SAMPLE", "SPECIMEN", "NO VALIDO", "ESTE ARCHIVO ES INVALIDO", o similares. Extrae ÚNICAMENTE los datos reales del certificado.
2. Si un campo no está visible en la imagen, usa null.
3. No agregues markdown, explicaciones, comentarios ni texto adicional. Solo el JSON puro.
4. Para fechas en español como "15 de junio de 2023", conviértelas a "2023-06-15".`;

    return this.callOpenAI(prompt, imageUrl, 'certificate');
  }

  async extractIdDocument(
    buffer: Buffer,
    mimeType: string,
    _originalName: string,
  ): Promise<ExtractionResult<ExtractedIdData>> {
    if (!this.enabled || !this.apiKey) {
      return {
        success: false,
        error: {
          code: 'technical_failure',
          message: 'Azure OpenAI fallback not enabled or not configured',
        },
      };
    }

    const base64Image = buffer.toString('base64');
    const imageUrl = `data:${mimeType};base64,${base64Image}`;

    const prompt = `Eres un extractor especializado de credenciales de elector mexicanas (INE/IFE) y documentos de identidad.

Tu tarea es analizar la imagen de una credencial para votar mexicana y devolver ÚNICAMENTE un objeto JSON válido con estos campos:
- fullName: nombre completo del titular (string)
- curp: CURP (string, 18 caracteres alfanuméricos) o null
- documentType: tipo de documento (string). Usa "ine" si es INE/IFE mexicana, "passport" si es pasaporte, "driver_license" si es licencia de conducir, u "other" si no sabes.
- birthDate: fecha de nacimiento en formato ISO 8601 (YYYY-MM-DD) o null
- expirationDate: fecha de vigencia o expiración en formato ISO 8601 (YYYY-MM-DD) o null
- documentIdentifier: clave de elector o número de documento (string) o null
- issuingCountry: país emisor (string). Usa "México" si es INE.

REGLAS IMPORTANTES:
1. Ignora COMPLETAMENTE cualquier marca de agua, texto de prueba, o sello que diga "INVALIDO", "SAMPLE", "SPECIMEN", "NO VALIDO", "ESTE ARCHIVO ES INVALIDO", o similares. Extrae ÚNICAMENTE los datos reales del documento.
2. Si un campo no está visible en la imagen, usa null.
3. No agregues markdown, explicaciones, comentarios ni texto adicional. Solo el JSON puro.
4. Para fechas en español como "22/03/2002", conviértelas a "2002-03-22".
5. El campo curp debe tener exactamente 18 caracteres alfanuméricos (4 letras + 6 números + 6 letras + 2 números). Si no coincide con ese patrón, usa null.`;

    return this.callOpenAI(prompt, imageUrl, 'id');
  }

  private async callOpenAI(
    systemPrompt: string,
    imageUrl: string,
    documentType: 'certificate' | 'id',
  ): Promise<ExtractionResult<any>> {
    const url = this.buildOpenAIUrl();

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-key': this.apiKey,
        },
        body: JSON.stringify({
          messages: [
            {
              role: 'system',
              content: systemPrompt,
            },
            {
              role: 'user',
              content: [
                {
                  type: 'image_url',
                  image_url: {
                    url: imageUrl,
                  },
                },
                {
                  type: 'text',
                  text:
                    'Extrae los datos solicitados de esta imagen y devuélvelos ÚNICAMENTE como JSON puro.',
                },
              ],
            },
          ],
          max_tokens: 4096,
          temperature: 0.0,
          response_format: { type: 'json_object' },
        }),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown');
        return {
          success: false,
          error: {
            code: 'technical_failure',
            message: `Azure OpenAI request failed (${response.status}): ${errorText}`,
          },
        };
      }

      const body = await response.json();
      const rawContent = body.choices?.[0]?.message?.content ?? '';

      let parsed: any;
      try {
        parsed = JSON.parse(rawContent);
      } catch {
        return {
          success: false,
          error: {
            code: 'technical_failure',
            message: 'Azure OpenAI returned invalid JSON',
          },
        };
      }

      if (!parsed.fullName || typeof parsed.fullName !== 'string') {
        return {
          success: false,
          error: {
            code: 'insufficient_data',
            message: 'Azure OpenAI could not extract full name from document',
          },
        };
      }

      if (documentType === 'certificate') {
        return this.mapToCertificateData(parsed);
      }
      return this.mapToIdData(parsed);
    } catch (error: unknown) {
      clearTimeout(timeout);
      const message =
        error instanceof Error ? error.message : 'Unknown OpenAI error';
      return {
        success: false,
        error: {
          code: 'technical_failure',
          message,
        },
      };
    }
  }

  private buildOpenAIUrl(): string {
    const trimmed = this.endpoint.trim();

    // Si el endpoint ya incluye la ruta completa de chat completions, úsalo directamente
    if (trimmed.includes('/openai/deployments/') && trimmed.includes('/chat/completions')) {
      return trimmed;
    }

    // Si el endpoint es solo el dominio base, construir la URL completa
    const base = trimmed.replace(/\/*$/, '');
    return `${base}/openai/deployments/${this.deploymentName}/chat/completions?api-version=${this.apiVersion}`;
  }

  private mapToCertificateData(
    parsed: any,
  ): ExtractionResult<ExtractedCertificateData> {
    const data = ExtractedCertificateData.create({
      fullName: String(parsed.fullName ?? '').trim() || 'Unknown',
      certificateName:
        String(parsed.certificateName ?? '').trim() || 'Unknown Certificate',
      issuingOrganization:
        String(parsed.issuingOrganization ?? '').trim() ||
        'Unknown Organization',
      issueDate: this.parseDate(parsed.issueDate),
      expirationDate: this.parseDate(parsed.expirationDate),
      folioNumber:
        parsed.folioNumber != null
          ? String(parsed.folioNumber).trim()
          : undefined,
      qrUrl:
        parsed.qrUrl != null ? String(parsed.qrUrl).trim() : undefined,
      ocrConfidence: 0.75,
      curp:
        parsed.curp != null ? String(parsed.curp).trim() : undefined,
      documentType: 'certificate',
      certifyingInstitution:
        parsed.certifyingInstitution != null
          ? String(parsed.certifyingInstitution).trim()
          : undefined,
      competencyStandardCode:
        parsed.competencyStandardCode != null
          ? String(parsed.competencyStandardCode).trim()
          : undefined,
      competencyStandardName:
        parsed.competencyStandardName != null
          ? String(parsed.competencyStandardName).trim()
          : undefined,
    });

    return { success: true, data };
  }

  private mapToIdData(parsed: any): ExtractionResult<ExtractedIdData> {
    const data = ExtractedIdData.create({
      fullName: String(parsed.fullName ?? '').trim() || 'Unknown',
      documentType: String(parsed.documentType ?? 'other').trim(),
      issuingCountry:
        parsed.issuingCountry != null
          ? String(parsed.issuingCountry).trim()
          : undefined,
      birthDate: this.parseDate(parsed.birthDate),
      expirationDate: this.parseDate(parsed.expirationDate),
      documentIdentifier:
        parsed.documentIdentifier != null
          ? String(parsed.documentIdentifier).trim()
          : undefined,
      ocrConfidence: 0.75,
      curp:
        parsed.curp != null ? String(parsed.curp).trim() : undefined,
    });

    return { success: true, data };
  }

  private parseDate(value: unknown): Date | undefined {
    if (!value || value === 'null' || value === null) return undefined;

    const str = String(value).trim();
    if (!str) return undefined;

    // ISO 8601 directo
    const iso = new Date(str);
    if (!isNaN(iso.getTime())) return iso;

    // dd/mm/yyyy o dd-mm-yyyy
    const slashMatch = str.match(/(\d{1,2})[-\/]\s*(\d{1,2})[-\/]\s*(\d{4})/);
    if (slashMatch) {
      const [, day, month, year] = slashMatch;
      const parsed = new Date(
        parseInt(year),
        parseInt(month) - 1,
        parseInt(day),
      );
      if (!isNaN(parsed.getTime())) return parsed;
    }

    // "15 de junio de 2023"
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
    const spanishMatch = str.match(
      /(\d{1,2})\s+de\s+(\w+)\s+de\s+(\d{4})/i,
    );
    if (spanishMatch) {
      const [, day, monthStr, year] = spanishMatch;
      const month = months[monthStr.toLowerCase()];
      if (month !== undefined) {
        const parsed = new Date(parseInt(year), month, parseInt(day));
        if (!isNaN(parsed.getTime())) return parsed;
      }
    }

    return undefined;
  }
}
