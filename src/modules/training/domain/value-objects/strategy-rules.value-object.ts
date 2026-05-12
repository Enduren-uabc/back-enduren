/**
 * StrategyRules value object.
 * Defines how sets are generated for a training strategy.
 * Stored as JSON in persistence, parsed to this VO in domain.
 */
export interface StrategyRulesJson {
  type: 'linear' | 'percentage' | 'wave';
  weightStep?: number;
  repStep?: number;
  weightPercentage?: number;
  wavePercentages?: number[];
}

export class StrategyRules {
  public readonly type: 'linear' | 'percentage' | 'wave';
  public readonly weightStep: number | null;
  public readonly repStep: number | null;
  public readonly weightPercentage: number | null;
  public readonly wavePercentages: number[] | null;

  private constructor(
    type: 'linear' | 'percentage' | 'wave',
    weightStep: number | null,
    repStep: number | null,
    weightPercentage: number | null,
    wavePercentages: number[] | null,
  ) {
    this.type = type;
    this.weightStep = weightStep;
    this.repStep = repStep;
    this.weightPercentage = weightPercentage;
    this.wavePercentages = wavePercentages;
  }

  public static create(json: StrategyRulesJson): StrategyRules {
    if (!json || typeof json !== 'object') {
      throw new Error('StrategyRules JSON is required');
    }

    const validTypes: Array<'linear' | 'percentage' | 'wave'> = [
      'linear',
      'percentage',
      'wave',
    ];
    if (!validTypes.includes(json.type)) {
      throw new Error(`Invalid strategy rules type: ${json.type}`);
    }

    return new StrategyRules(
      json.type,
      json.weightStep ?? null,
      json.repStep ?? null,
      json.weightPercentage ?? null,
      json.wavePercentages ?? null,
    );
  }

  public static reconstitute(json: StrategyRulesJson): StrategyRules {
    return new StrategyRules(
      json.type,
      json.weightStep ?? null,
      json.repStep ?? null,
      json.weightPercentage ?? null,
      json.wavePercentages ?? null,
    );
  }

  public toJson(): StrategyRulesJson {
    const json: StrategyRulesJson = { type: this.type };
    if (this.weightStep !== null) json.weightStep = this.weightStep;
    if (this.repStep !== null) json.repStep = this.repStep;
    if (this.weightPercentage !== null)
      json.weightPercentage = this.weightPercentage;
    if (this.wavePercentages !== null)
      json.wavePercentages = this.wavePercentages;
    return json;
  }
}
