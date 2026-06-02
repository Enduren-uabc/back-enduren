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
    // Certificaciones CONOCER México - EC = Estándar de Competencia
    'ec',
    'ec0474',
    'estandar de competencia',
    'conocer',
    'icemi',
    'instituto de certificacion',
    'mantenimiento de la salud',
    'jovenes y adultos',
    // Términos adicionales de fitness
    'fisico',
    'physical',
    'entrenamiento',
    'training',
    'gimnasio',
    'gym',
    'deportivo',
    'atletico',
    'athletic',
    'rendimiento',
    'performance',
    'capacitacion',
    'preparador',
    'instructor',
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
          message: 'No se pudo extraer la información del certificado',
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
          code: 'CERTIFICATE_WITHOUT_NAME',
          severity: 'medium',
          message: 'El certificado no contiene nombre del titular',
        }),
      );
    }

    if (data.issuingOrganization && data.issuingOrganization.length > 2) {
      score += 4;
      positive.push('Institución emisora presente');
    } else {
      alerts.push(
        RiskAlert.create({
          code: 'UNKNOWN_INSTITUTION',
          severity: 'medium',
          message: 'No se detectó institución emisora en el certificado',
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
          message:
            'El certificado no está relacionado con fitness, entrenamiento o salud',
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
            message: 'No se pudo extraer la información de la identificación',
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
          message: 'La identificación está vencida',
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
            message: 'El usuario es menor de edad',
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
            code: 'CERTIFICATE_WITHOUT_NAME',
            severity: 'medium',
            message: 'No hay nombre en el certificado para comparar',
          }),
        );
      if (!idName)
        alerts.push(
          RiskAlert.create({
            code: 'DOCUMENT_EXTRACTION_FAILED',
            severity: 'medium',
            message: 'No hay nombre en la identificación para comparar',
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
            message: 'El nombre tiene pequeñas diferencias tras normalización',
          }),
        );
        break;
      case 'partial':
        alerts.push(
          RiskAlert.create({
            code: 'PARTIAL_NAME_MATCH',
            severity: 'medium',
            message: 'El nombre coincide parcialmente',
          }),
        );
        break;
      case 'low':
        alerts.push(
          RiskAlert.create({
            code: 'LOW_NAME_MATCH',
            severity: 'high',
            message: 'El nombre tiene baja coincidencia',
          }),
        );
        break;
      case 'none':
        alerts.push(
          RiskAlert.create({
            code: 'NO_NAME_MATCH',
            severity: 'critical',
            message: 'Los nombres no coinciden',
          }),
        );
        break;
    }

    const certCurp = input.certificateData?.curp;
    const idCurp = input.idData?.curp;
    if (certCurp && idCurp) {
      const curpResult = this.nameComparison.compareCurp(certCurp, idCurp);
      if (curpResult.level === 'exact') {
        positive.push('CURP coincide entre certificado e INE');
      } else {
        alerts.push(
          RiskAlert.create({
            code: 'CURP_MISMATCH',
            severity: 'critical',
            message: `El CURP del certificado no coincide con el CURP de la INE`,
          }),
        );
      }
    } else if (certCurp && !idCurp) {
      alerts.push(
        RiskAlert.create({
          code: 'ID_WITHOUT_CURP',
          severity: 'medium',
          message:
            'No se pudo extraer el CURP de la identificación para comparar',
        }),
      );
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
          message: 'El certificado no tiene folio detectable',
        }),
      );
    }

    if (data.qrUrl || data.hasVeracityCode) {
      score += 3;
      positive.push('Certificado con QR o código de veracidad detectado');
    } else {
      alerts.push(
        RiskAlert.create({
          code: 'CERTIFICATE_WITHOUT_QR',
          severity: 'info',
          message: 'El certificado no tiene QR ni URL de validación',
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
          message: 'Institución emisora desconocida',
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
          message: 'La confianza OCR es baja',
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
    return `Puntaje ${totalScore}/100 (cert:${certScore} id:${idScore} nombre:${nameScore} verif:${verifScore} ops:${opsScore}) — Riesgo: ${riskLevel}`;
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

  private calculateAge(birthDate: Date | string): number {
    const bd = typeof birthDate === 'string' ? new Date(birthDate) : birthDate;
    const today = new Date();
    let age = today.getFullYear() - bd.getFullYear();
    const m = today.getMonth() - bd.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < bd.getDate())) {
      age--;
    }
    return age;
  }
}
