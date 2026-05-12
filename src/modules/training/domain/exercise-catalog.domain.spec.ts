import { ExerciseCatalogEntry } from './entities/exercise-catalog-entry.entity';
import {
  ExerciseCatalogDomainError,
  ExerciseCatalogErrorCode,
} from './errors/exercise-catalog-domain.error';

describe('ExerciseCatalogEntry Entity', () => {
  describe('create', () => {
    it('should create a valid entry with all fields', () => {
      const entry = ExerciseCatalogEntry.create(
        'ec-1',
        'Bench Press',
        'chest',
        'Pectoralis Major',
        'barbell',
      );
      expect(entry.id).toBe('ec-1');
      expect(entry.name).toBe('Bench Press');
      expect(entry.category).toBe('chest');
      expect(entry.primaryMuscleGroup).toBe('Pectoralis Major');
      expect(entry.equipment).toBe('barbell');
    });

    it('should trim the name', () => {
      const entry = ExerciseCatalogEntry.create(
        'ec-1',
        '  Bench Press  ',
        'chest',
        'Pectoralis Major',
        'barbell',
      );
      expect(entry.name).toBe('Bench Press');
    });

    it('should reject an empty name', () => {
      expect(() =>
        ExerciseCatalogEntry.create(
          'ec-1',
          '',
          'chest',
          'Pectoralis Major',
          'barbell',
        ),
      ).toThrow(ExerciseCatalogDomainError);
      try {
        ExerciseCatalogEntry.create(
          'ec-1',
          '',
          'chest',
          'Pectoralis Major',
          'barbell',
        );
      } catch (error) {
        expect(error).toBeInstanceOf(ExerciseCatalogDomainError);
        const domainError = error as ExerciseCatalogDomainError;
        expect(domainError.code).toBe(
          ExerciseCatalogErrorCode.EXERCISE_NAME_REQUIRED,
        );
      }
    });

    it('should reject a whitespace-only name', () => {
      expect(() =>
        ExerciseCatalogEntry.create(
          'ec-1',
          '   ',
          'chest',
          'Pectoralis Major',
          'barbell',
        ),
      ).toThrow(ExerciseCatalogDomainError);
    });

    it('should reject an invalid category', () => {
      expect(() =>
        ExerciseCatalogEntry.create(
          'ec-1',
          'Bench Press',
          'invalid-category',
          'Pectoralis Major',
          'barbell',
        ),
      ).toThrow(ExerciseCatalogDomainError);
      try {
        ExerciseCatalogEntry.create(
          'ec-1',
          'Bench Press',
          'invalid-category',
          'Pectoralis Major',
          'barbell',
        );
      } catch (error) {
        expect(error).toBeInstanceOf(ExerciseCatalogDomainError);
        const domainError = error as ExerciseCatalogDomainError;
        expect(domainError.code).toBe(
          ExerciseCatalogErrorCode.EXERCISE_CATEGORY_INVALID,
        );
      }
    });

    it('should reject an invalid equipment', () => {
      expect(() =>
        ExerciseCatalogEntry.create(
          'ec-1',
          'Bench Press',
          'chest',
          'Pectoralis Major',
          'invalid-equipment',
        ),
      ).toThrow(ExerciseCatalogDomainError);
      try {
        ExerciseCatalogEntry.create(
          'ec-1',
          'Bench Press',
          'chest',
          'Pectoralis Major',
          'invalid-equipment',
        );
      } catch (error) {
        expect(error).toBeInstanceOf(ExerciseCatalogDomainError);
        const domainError = error as ExerciseCatalogDomainError;
        expect(domainError.code).toBe(
          ExerciseCatalogErrorCode.EXERCISE_EQUIPMENT_INVALID,
        );
      }
    });

    it('should accept all valid categories', () => {
      const categories = [
        'chest',
        'back',
        'legs',
        'shoulders',
        'arms',
        'core',
        'cardio',
      ];
      categories.forEach((category) => {
        const entry = ExerciseCatalogEntry.create(
          'ec-1',
          'Test',
          category,
          'Muscle',
          'barbell',
        );
        expect(entry.category).toBe(category);
      });
    });

    it('should accept all valid equipment types', () => {
      const equipmentTypes = [
        'barbell',
        'dumbbell',
        'machine',
        'bodyweight',
        'cable',
        'kettlebell',
      ];
      equipmentTypes.forEach((equipment) => {
        const entry = ExerciseCatalogEntry.create(
          'ec-1',
          'Test',
          'chest',
          'Muscle',
          equipment,
        );
        expect(entry.equipment).toBe(equipment);
      });
    });
  });

  describe('reconstitute', () => {
    it('should reconstitute an entry from persistence', () => {
      const entry = ExerciseCatalogEntry.reconstitute(
        'ec-1',
        'Bench Press',
        'chest',
        'Pectoralis Major',
        'barbell',
      );
      expect(entry.id).toBe('ec-1');
      expect(entry.name).toBe('Bench Press');
      expect(entry.category).toBe('chest');
    });
  });
});
