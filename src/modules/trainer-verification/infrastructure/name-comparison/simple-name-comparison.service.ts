import { Injectable } from '@nestjs/common';
import {
  NameComparisonPort,
  NameComparisonResult,
} from '../../application/ports/name-comparison.port';

@Injectable()
export class SimpleNameComparisonService implements NameComparisonPort {
  compare(certName: string, idName: string): NameComparisonResult {
    const normalizedCert = this.normalize(certName);
    const normalizedId = this.normalize(idName);

    if (normalizedCert === normalizedId) {
      return {
        level: 'exact',
        score: 23,
        normalizedCertName: normalizedCert,
        normalizedIdName: normalizedId,
      };
    }

    const certTokens = normalizedCert.split(' ').filter(Boolean);
    const idTokens = normalizedId.split(' ').filter(Boolean);

    const common = certTokens.filter((t) => idTokens.includes(t));
    const allTokens = [...new Set([...certTokens, ...idTokens])];

    if (allTokens.length === 0) {
      return {
        level: 'none',
        score: 0,
        normalizedCertName: normalizedCert,
        normalizedIdName: normalizedId,
      };
    }

    const similarity = common.length / allTokens.length;

    if (similarity >= 0.8) {
      return {
        level: 'strong',
        score: 20,
        normalizedCertName: normalizedCert,
        normalizedIdName: normalizedId,
      };
    }
    if (similarity >= 0.5) {
      return {
        level: 'partial',
        score: 14,
        normalizedCertName: normalizedCert,
        normalizedIdName: normalizedId,
      };
    }
    if (similarity >= 0.2) {
      return {
        level: 'low',
        score: 6,
        normalizedCertName: normalizedCert,
        normalizedIdName: normalizedId,
      };
    }

    return {
      level: 'none',
      score: 0,
      normalizedCertName: normalizedCert,
      normalizedIdName: normalizedId,
    };
  }

  private normalize(name: string): string {
    return name
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9\s]/g, '')
      .replace(/\s+/g, ' ')
      .trim()
      .toLowerCase();
  }
}
