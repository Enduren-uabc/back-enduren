import { RiskLevel } from './risk-level.vo';
import { RiskAlert } from './risk-alert.vo';

export type RecommendedAction =
  | 'quick_review'
  | 'normal_review'
  | 'strict_review'
  | 'correction'
  | 'block'
  | 'reject';

export interface ScoringResultProps {
  riskScore: number;
  riskLevel: RiskLevel;
  recommendedAction: RecommendedAction;
  summary: string;
  positiveSignals: string[];
  alerts: RiskAlert[];
  overrides: string[];
}

export class ScoringResult {
  public readonly riskScore: number;
  public readonly riskLevel: RiskLevel;
  public readonly recommendedAction: RecommendedAction;
  public readonly summary: string;
  public readonly positiveSignals: string[];
  public readonly alerts: RiskAlert[];
  public readonly overrides: string[];

  private constructor(props: ScoringResultProps) {
    this.riskScore = props.riskScore;
    this.riskLevel = props.riskLevel;
    this.recommendedAction = props.recommendedAction;
    this.summary = props.summary;
    this.positiveSignals = props.positiveSignals;
    this.alerts = props.alerts;
    this.overrides = props.overrides;
  }

  static create(props: ScoringResultProps): ScoringResult {
    return new ScoringResult(props);
  }

  static reconstitute(props: ScoringResultProps): ScoringResult {
    return new ScoringResult(props);
  }
}
