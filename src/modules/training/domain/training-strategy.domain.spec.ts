import { TrainingStrategy } from './entities/training-strategy.entity';
import {
  TrainingStrategyDomainError,
  TrainingStrategyErrorCode,
} from './errors/training-strategy-domain.error';

describe('TrainingStrategy domain entity', () => {
  describe('create', () => {
    it('should create a valid strategy', () => {
      const strategy = TrainingStrategy.create(
        'straight',
        'Straight',
        'Constant weight and reps.',
        { type: 'linear', weightStep: 0, repStep: 0 },
      );
      expect(strategy.key).toBe('straight');
      expect(strategy.name).toBe('Straight');
      expect(strategy.description).toBe('Constant weight and reps.');
      expect(strategy.rules.type).toBe('linear');
    });

    it('should trim key and name', () => {
      const strategy = TrainingStrategy.create(
        '  straight  ',
        '  Straight  ',
        'Desc',
        { type: 'linear', weightStep: 0, repStep: 0 },
      );
      expect(strategy.key).toBe('straight');
      expect(strategy.name).toBe('Straight');
    });

    it('should reject empty key', () => {
      expect(() =>
        TrainingStrategy.create('', 'Name', 'Desc', {
          type: 'linear',
          weightStep: 0,
          repStep: 0,
        }),
      ).toThrow(TrainingStrategyDomainError);
      try {
        TrainingStrategy.create('', 'Name', 'Desc', {
          type: 'linear',
          weightStep: 0,
          repStep: 0,
        });
      } catch (error) {
        const e = error as TrainingStrategyDomainError;
        expect(e.code).toBe(TrainingStrategyErrorCode.STRATEGY_KEY_REQUIRED);
      }
    });

    it('should reject empty name', () => {
      expect(() =>
        TrainingStrategy.create('key', '', 'Desc', {
          type: 'linear',
          weightStep: 0,
          repStep: 0,
        }),
      ).toThrow(TrainingStrategyDomainError);
    });
  });

  describe('reconstitute', () => {
    it('should reconstitute from persistence', () => {
      const strategy = TrainingStrategy.reconstitute(
        'ascending',
        'Ascending',
        'Up',
        { type: 'linear', weightStep: 2.5, repStep: -2 },
      );
      expect(strategy.key).toBe('ascending');
      expect(strategy.rules.weightStep).toBe(2.5);
    });
  });

  describe('seedStrategies', () => {
    it('should return 5 strategies', () => {
      const strategies = TrainingStrategy.seedStrategies();
      expect(strategies).toHaveLength(5);
      const keys = strategies.map((s) => s.key);
      expect(keys).toEqual([
        'straight',
        'ascending',
        'descending',
        'drop_sets',
        'wave_loading',
      ]);
    });
  });

  describe('generateSets', () => {
    it('straight: 4 sets x 30kg x 10 reps -> [30/10, 30/10, 30/10, 30/10]', () => {
      const strategy = TrainingStrategy.seedStrategies()[0]; // straight
      const sets = strategy.generateSets(4, 30, 10);
      expect(sets).toEqual([
        { setNumber: 1, reps: 10, weight: 30 },
        { setNumber: 2, reps: 10, weight: 30 },
        { setNumber: 3, reps: 10, weight: 30 },
        { setNumber: 4, reps: 10, weight: 30 },
      ]);
    });

    it('ascending: 4 sets, 30kg, 10 reps -> [30/10, 32.5/8, 35/6, 37.5/4]', () => {
      const strategy = TrainingStrategy.seedStrategies()[1]; // ascending
      const sets = strategy.generateSets(4, 30, 10);
      expect(sets).toEqual([
        { setNumber: 1, reps: 10, weight: 30 },
        { setNumber: 2, reps: 8, weight: 32.5 },
        { setNumber: 3, reps: 6, weight: 35 },
        { setNumber: 4, reps: 4, weight: 37.5 },
      ]);
    });

    it('descending: 4 sets, 30kg, 10 reps -> [30/10, 27.5/12, 25/14, 22.5/16]', () => {
      const strategy = TrainingStrategy.seedStrategies()[2]; // descending
      const sets = strategy.generateSets(4, 30, 10);
      expect(sets).toEqual([
        { setNumber: 1, reps: 10, weight: 30 },
        { setNumber: 2, reps: 12, weight: 27.5 },
        { setNumber: 3, reps: 14, weight: 25 },
        { setNumber: 4, reps: 16, weight: 22.5 },
      ]);
    });

    it('drop_sets: 3 sets, 30kg, 10 reps -> [30/10, 24/10, 19.2/10]', () => {
      const strategy = TrainingStrategy.seedStrategies()[3]; // drop_sets
      const sets = strategy.generateSets(3, 30, 10);
      expect(sets).toEqual([
        { setNumber: 1, reps: 10, weight: 30 },
        { setNumber: 2, reps: 10, weight: 24 },
        { setNumber: 3, reps: 10, weight: 19.2 },
      ]);
    });

    it('wave_loading: 4 sets, 30kg, 10 reps with pattern [0%, +5%, +2.5%, +7.5%]', () => {
      const strategy = TrainingStrategy.seedStrategies()[4]; // wave_loading
      const sets = strategy.generateSets(4, 30, 10);
      expect(sets).toEqual([
        { setNumber: 1, reps: 10, weight: 30 },
        { setNumber: 2, reps: 10, weight: 31.5 },
        { setNumber: 3, reps: 10, weight: 30.75 },
        { setNumber: 4, reps: 10, weight: 32.25 },
      ]);
    });

    it('wave_loading should cycle pattern for more sets than percentages', () => {
      const strategy = TrainingStrategy.seedStrategies()[4]; // wave_loading
      const sets = strategy.generateSets(5, 20, 8);
      expect(sets[4]).toEqual({
        setNumber: 5,
        reps: 8,
        weight: 20, // cycles back to first percentage (0)
      });
    });

    it('ascending should enforce minimum 1 rep', () => {
      const strategy = TrainingStrategy.seedStrategies()[1]; // ascending
      const sets = strategy.generateSets(6, 30, 5);
      expect(sets[sets.length - 1].reps).toBe(1);
    });
  });
});
