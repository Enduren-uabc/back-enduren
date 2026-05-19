import { Inject, Injectable } from '@nestjs/common';
import {
  NAME_COMPARISON_PORT,
  NameComparisonPort,
} from '../ports/name-comparison.port';
import { ExtractedCertificateData } from '../../domain/value-objects/extracted-certificate-data.vo';
import { ExtractedIdData } from '../../domain/value-objects/extracted-id-data.vo';
import { ScoringResult } from '../../domain/value-objects/scoring-result.vo';
import { RiskAlert } from '../../domain/value-objects/risk-alert.vo';
import { RiskLevel } from '../../domain/value-objects/risk-level.vo';

export interface ScoringInput {
  certificateData: ExtractedCertificateData | null;
  idData: ExtractedIdData | null;
  idExtractionFailed: boolean;
}

@Injectable()
export class RiskScoringService {
  private readonly fitnessKeywords = [
    'fitness',
    'entrenador',
    'trainer',
    'coach',
    'ejercicio',
    'exercise',
    'nutricion',
    'nutrition',
    'deporte',
    'sport',
    'salud',
    'health',
    'fuerza',
    'strength',
    'acondicionamiento',
    'conditioning',
    'crossfit',
    'yoga',
    'pilates',
    'musculacion',
    'personal trainer',
    'cpt',
    'nasm',
    'ace',
    'issa',
    'nsca',
    'acsm',
    'pesas',
    'weight',
    'funcional',
    'functional',
    'hiit',
    'calistenia',
    'calisthenics',
    'rehabilitacion',
    'rehabilitation',
    'bienestar',
    'wellness',
    'fisiologia',
    'physiology',
    'kinesiologia',
    'anatomia',
    'anatomy',
  ];

  constructor(
    @Inject(NAME_COMPARISON_PORT)
    private readonly nameComparison: NameComparisonPort,
  ) {}

  calculate(input: ScoringInput): ScoringResult {
    const alerts: RiskAlert[] = [];
    const overrides: string[] = [];
    const positiveSignals: string[] = [];
    let totalScore = 0;

    const certScore = this.scoreCertificate(
      input.certificateData,
      alerts,
      positiveSignals,
    );
    const idScore = this.scoreId(
      input.idData,
      input.idExtractionFailed,
      alerts,
      positiveSignals,
    );
    const nameScore = this.scoreNameMatch(input, alerts, positiveSignals);
    const verifScore = this.scoreVerifiability(
      input.certificateData,
      alerts,
      positiveSignals,
    );
    const opsScore = this.scoreOperational(input, alerts, positiveSignals);

    totalScore = certScore + idScore + nameScore + verifScore + opsScore;

    let riskLevel = this.scoreToLevel(totalScore);
    let recommendedAction = this.levelToAction(riskLevel);

    for (const override of overrides) {
      if (override === 'critical') {
        riskLevel = 'critical';
        recommendedAction = 'block';
        break;
      }
      if (override === 'high' && riskLevel !== 'critical') {
        riskLevel = 'high';
        recommendedAction = 'strict_review';
      }
    }

    const summary = this.buildSummary(
      certScore,
      idScore,
      nameScore,
      verifScore,
      opsScore,
      totalScore,
      riskLevel,
    );

    return ScoringResult.create({
      riskScore: totalScore,
      riskLevel,
      recommendedAction,
      summary,
      positiveSignals,
      alerts,
      overrides,
    });
  }

  private scoreCertificate(
    data: ExtractedCertificateData | null,
    alerts: RiskAlert[],
    positive: string[],
  ): number {
    if (!data) {
      alerts.push(
        RiskAlert.create({
          code: 'DOCUMENT_EXTRACTION_FAILED',
          severity: 'high',
          message: 'Certificate data not available',
        }),
      );
      return 0;
    }

    let score = 0;

    if (data.fullName && data.fullName.length > 2) {
      score += 4;
      positive.push('Certificado con nombre del titular');
    } else {
      alerts.push(
        RiskAlert.create({
          code: 'CERTIFICATE_WITHOUT_FOLIO',
          severity: 'medium',
          message: 'Certificate holder name missing',
        }),
      );
    }

    if (data.issuingOrganization && data.issuingOrganization.length > 2) {
      score += 4;
      positive.push('Institución emisora presente');
    } else {
      alerts.push(
        RiskAlert.create({
          code: 'CERTIFICATE_WITHOUT_QR',
          severity: 'medium',
          message: 'Issuing organization missing',
        }),
      );
    }

    score += 5;

    if (this.isFitnessRelated(data)) {
      score += 8;
      positive.push('Certificado relacionado con fitness o entrenamiento');
    } else {
      score += 0;
      alerts.push(
        RiskAlert.create({
          code: 'DOCUMENT_NOT_RELATED_TO_FITNESS',
          severity: 'high',
          message: 'Certificate not related to fitness, training or health',
        }),
      );
    }

    if (data.issueDate) score += 2;
    score += 2;

    if (data.ocrConfidence >= 0.8) {
      positive.push('Alta confianza OCR en certificado');
    }

    return score;
  }

  private scoreId(
    data: ExtractedIdData | null,
    extractionFailed: boolean,
    alerts: RiskAlert[],
    positive: string[],
  ): number {
    if (!data) {
      if (extractionFailed) {
        alerts.push(
          RiskAlert.create({
            code: 'DOCUMENT_EXTRACTION_FAILED',
            severity: 'medium',
            message: 'ID extraction failed',
          }),
        );
      }
      return 0;
    }

    let score = 0;

    score += 5;

    const docType = data.documentType?.toLowerCase() ?? '';
    if (
      ['ine', 'passport', 'driver_license'].some((t) => docType.includes(t))
    ) {
      score += 4;
    }

    if (data.fullName?.length > 2) score += 3;
    score += 3;

    if (data.expirationDate && data.expirationDate > new Date()) {
      score += 3;
      positive.push('ID vigente');
    } else if (data.expirationDate && data.expirationDate <= new Date()) {
      score += 0;
      alerts.push(
        RiskAlert.create({
          code: 'EXPIRED_ID',
          severity: 'critical',
          message: 'ID document has expired',
        }),
      );
    }

    if (data.birthDate) {
      const age = this.calculateAge(data.birthDate);
      if (age >= 18) {
        score += 2;
        positive.push('Usuario mayor de edad');
      } else {
        score += 0;
        alerts.push(
          RiskAlert.create({
            code: 'UNDERAGE_USER',
            severity: 'critical',
            message: 'User is underage',
          }),
        );
      }
    }

    if (data.ocrConfidence >= 0.8) {
      positive.push('Alta confianza OCR en ID');
    }

    return score;
  }

  private scoreNameMatch(
    input: ScoringInput,
    alerts: RiskAlert[],
    positive: string[],
  ): number {
    const certName = input.certificateData?.fullName;
    const idName = input.idData?.fullName;

    if (!certName || !idName) {
      if (!certName)
        alerts.push(
          RiskAlert.create({
            code: 'CERTIFICATE_WITHOUT_FOLIO',
            severity: 'medium',
            message: 'No certificate name to compare',
          }),
        );
      if (!idName)
        alerts.push(
          RiskAlert.create({
            code: 'DOCUMENT_EXTRACTION_FAILED',
            severity: 'medium',
            message: 'No ID name to compare',
          }),
        );
      return 0;
    }

    const result = this.nameComparison.compare(certName, idName);

    switch (result.level) {
      case 'exact':
        positive.push('Nombre coincide exactamente');
        break;
      case 'strong':
        alerts.push(
          RiskAlert.create({
            code: 'PARTIAL_NAME_MATCH',
            severity: 'info',
            message: 'Name has minor differences after normalization',
          }),
        );
        break;
      case 'partial':
        alerts.push(
          RiskAlert.create({
            code: 'PARTIAL_NAME_MATCH',
            severity: 'medium',
            message: 'Name partially matches',
          }),
        );
        break;
      case 'low':
        alerts.push(
          RiskAlert.create({
            code: 'LOW_NAME_MATCH',
            severity: 'high',
            message: 'Name has low match',
          }),
        );
        break;
      case 'none':
        alerts.push(
          RiskAlert.create({
            code: 'NO_NAME_MATCH',
            severity: 'critical',
            message: 'Names do not match',
          }),
        );
        break;
    }

    return result.score;
  }

  private scoreVerifiability(
    data: ExtractedCertificateData | null,
    alerts: RiskAlert[],
    positive: string[],
  ): number {
    if (!data) return 0;

    let score = 0;

    if (data.folioNumber) {
      score += 4;
      positive.push('Certificado con folio');
    } else {
      alerts.push(
        RiskAlert.create({
          code: 'CERTIFICATE_WITHOUT_FOLIO',
          severity: 'medium',
          message: 'Certificate has no detectable folio number',
        }),
      );
    }

    if (data.qrUrl) {
      score += 3;
      positive.push('Certificado con QR o URL de verificación');
    } else {
      alerts.push(
        RiskAlert.create({
          code: 'CERTIFICATE_WITHOUT_QR',
          severity: 'info',
          message: 'Certificate has no QR or verification URL',
        }),
      );
    }

    if (data.issuingOrganization) {
      score += 6;
    } else {
      alerts.push(
        RiskAlert.create({
          code: 'UNKNOWN_INSTITUTION',
          severity: 'medium',
          message: 'Issuing institution unknown',
        }),
      );
    }

    score += 3;
    score += 4;

    return score;
  }

  private scoreOperational(
    input: ScoringInput,
    alerts: RiskAlert[],
    positive: string[],
  ): number {
    let score = 0;

    const certConf = input.certificateData?.ocrConfidence ?? 0;
    const idConf = input.idData?.ocrConfidence ?? 0;
    const avgConf = (certConf + idConf) / 2;

    if (avgConf >= 0.8) {
      score += 2;
      positive.push('Confianza OCR alta');
    } else if (avgConf < 0.6) {
      alerts.push(
        RiskAlert.create({
          code: 'LOW_OCR_CONFIDENCE',
          severity: 'medium',
          message: 'OCR confidence is low',
        }),
      );
    }

    score += 1;
    score += 2;

    return score;
  }

  private scoreToLevel(score: number): RiskLevel {
    if (score >= 80) return 'low';
    if (score >= 60) return 'medium';
    if (score >= 40) return 'high';
    return 'critical';
  }

  private levelToAction(level: RiskLevel): ScoringResult['recommendedAction'] {
    switch (level) {
      case 'low':
        return 'quick_review';
      case 'medium':
        return 'normal_review';
      case 'high':
        return 'strict_review';
      case 'critical':
        return 'block';
    }
  }

  private buildSummary(
    certScore: number,
    idScore: number,
    nameScore: number,
    verifScore: number,
    opsScore: number,
    totalScore: number,
    riskLevel: RiskLevel,
  ): string {
    return `Score ${totalScore}/100 (cert:${certScore} id:${idScore} name:${nameScore} verif:${verifScore} ops:${opsScore}) — Risk: ${riskLevel}`;
  }

  private isFitnessRelated(data: ExtractedCertificateData): boolean {
    const searchText = [
      data.certificateName,
      data.issuingOrganization,
      data.fullName,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();

    return this.fitnessKeywords.some((keyword) => searchText.includes(keyword));
  }

  private calculateAge(birthDate: Date): number {
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  }
}
