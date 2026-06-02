export const NAME_COMPARISON_PORT = Symbol('NAME_COMPARISON_PORT');

export type NameMatchLevel = 'exact' | 'strong' | 'partial' | 'low' | 'none';

export interface NameComparisonResult {
  level: NameMatchLevel;
  score: number;
  normalizedCertName: string;
  normalizedIdName: string;
}

export type CurpMatchLevel = 'exact' | 'mismatch';

export interface CurpComparisonResult {
  level: CurpMatchLevel;
  normalizedCertCurp: string;
  normalizedIdCurp: string;
}

export interface NameComparisonPort {
  compare(certName: string, idName: string): NameComparisonResult;
  compareCurp(
    certCurp: string | undefined,
    idCurp: string | undefined,
  ): CurpComparisonResult;
}
