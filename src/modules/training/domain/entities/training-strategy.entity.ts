import {
  TrainingStrategyDomainError,
  TrainingStrategyErrorCode,
} from '../errors/training-strategy-domain.error';
import {
  StrategyRules,
  StrategyRulesJson,
} from '../value-objects/strategy-rules.value-object';

export class TrainingStrategy {
  public readonly key: string;
  public readonly name: string;
  public readonly description: string;
  public readonly rules: StrategyRules;

  private constructor(
    key: string,
    name: string,
    description: string,
    rules: StrategyRules,
  ) {
    this.key = key;
    this.name = name;
    this.description = description;
    this.rules = rules;
  }

  public static create(
    key: string,
    name: string,
    description: string,
    rulesJson: StrategyRulesJson,
  ): TrainingStrategy {
    if (!key || key.trim().length === 0) {
      throw new TrainingStrategyDomainError(
        TrainingStrategyErrorCode.STRATEGY_KEY_REQUIRED,
        'Training strategy key is required',
        { key },
      );
    }

    if (!name || name.trim().length === 0) {
      throw new TrainingStrategyDomainError(
        TrainingStrategyErrorCode.STRATEGY_NAME_REQUIRED,
        'Training strategy name is required',
        { name },
      );
    }

    const rules = StrategyRules.create(rulesJson);

    return new TrainingStrategy(
      key.trim(),
      name.trim(),
      description.trim(),
      rules,
    );
  }

  public static reconstitute(
    key: string,
    name: string,
    description: string,
    rulesJson: StrategyRulesJson,
  ): TrainingStrategy {
    const rules = StrategyRules.reconstitute(rulesJson);
    return new TrainingStrategy(key, name, description, rules);
  }

  /**
   * Predefined seed strategies.
   */
  /**
   * Generates exercise sets based on this strategy's rules.
   * Domain-level calculation — zero framework imports.
   */
  public generateSets(
    numberOfSets: number,
    initialWeight: number,
    initialReps: number,
  ): Array<{ setNumber: number; reps: number; weight: number }> {
    const sets: Array<{ setNumber: number; reps: number; weight: number }> = [];

    for (let i = 0; i < numberOfSets; i++) {
      const setNumber = i + 1;

      if (this.rules.type === 'wave') {
        const percentages = this.rules.wavePercentages ?? [0];
        const pct = percentages[i % percentages.length];
        const weight = parseFloat((initialWeight * (1 + pct)).toFixed(2));
        sets.push({ setNumber, reps: initialReps, weight });
      } else if (this.rules.type === 'percentage') {
        const pct = this.rules.weightPercentage ?? 1;
        const weight =
          i === 0
            ? initialWeight
            : parseFloat((sets[i - 1].weight * pct).toFixed(2));
        const reps =
          this.rules.repStep !== null
            ? Math.max(1, initialReps + i * this.rules.repStep)
            : initialReps;
        sets.push({ setNumber, reps, weight });
      } else {
        // linear (including straight)
        const weightStep = this.rules.weightStep ?? 0;
        const repStep = this.rules.repStep ?? 0;
        const weight = parseFloat((initialWeight + i * weightStep).toFixed(2));
        const reps = Math.max(1, initialReps + i * repStep);
        sets.push({ setNumber, reps, weight });
      }
    }

    return sets;
  }

  public static seedStrategies(): TrainingStrategy[] {
    return [
      // 1. Straight (Estática)
      TrainingStrategy.create(
        'straight',
        'Straight (Estática)',
        'Peso y reps constantes en todos los sets.',
        { type: 'linear', weightStep: 0, repStep: 0 },
      ),
      // 2. Ascending / UPP (Pirámide Ascendente)
      TrainingStrategy.create(
        'ascending',
        'Ascending / UPP (Pirámide Ascendente)',
        'Sube peso, bajan reps en cada set.',
        { type: 'linear', weightStep: 2.5, repStep: -2 },
      ),
      // 3. Descending / Down (Pirámide Descendente)
      TrainingStrategy.create(
        'descending',
        'Descending / Down (Pirámide Descendente)',
        'Empieza peso máximo, baja peso, suben reps.',
        { type: 'linear', weightStep: -2.5, repStep: 2 },
      ),
      // 4. Drop Sets (Sobrecarga)
      TrainingStrategy.create(
        'drop_sets',
        'Drop Sets (Sobrecarga)',
        'Sin descanso, baja peso rápido, mismas reps.',
        { type: 'percentage', weightPercentage: 0.8, repStep: 0 },
      ),
      // 5. Wave Loading (Ondulante)
      TrainingStrategy.create(
        'wave_loading',
        'Wave Loading (Ondulante)',
        'Alterna pesos en olas sobre peso base, reps fijas.',
        { type: 'wave', wavePercentages: [0, 0.05, 0.025, 0.075] },
      ),
    ];
  }
}
