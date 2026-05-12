import {
  ExerciseCatalogDomainError,
  ExerciseCatalogErrorCode,
} from '../errors/exercise-catalog-domain.error';

export type ExerciseCategory =
  | 'chest'
  | 'back'
  | 'legs'
  | 'shoulders'
  | 'arms'
  | 'core'
  | 'cardio';

export type ExerciseEquipment =
  | 'barbell'
  | 'dumbbell'
  | 'machine'
  | 'bodyweight'
  | 'cable'
  | 'kettlebell';

const VALID_CATEGORIES: ExerciseCategory[] = [
  'chest',
  'back',
  'legs',
  'shoulders',
  'arms',
  'core',
  'cardio',
];

const VALID_EQUIPMENT: ExerciseEquipment[] = [
  'barbell',
  'dumbbell',
  'machine',
  'bodyweight',
  'cable',
  'kettlebell',
];

/**
 * ExerciseCatalogEntry domain entity.
 * Represents a globally available pre-defined exercise in the catalog.
 * RF-10, RF-10.0.8
 */
export class ExerciseCatalogEntry {
  public readonly id: string;
  public readonly name: string;
  public readonly category: ExerciseCategory;
  public readonly primaryMuscleGroup: string;
  public readonly equipment: ExerciseEquipment;

  private constructor(
    id: string,
    name: string,
    category: ExerciseCategory,
    primaryMuscleGroup: string,
    equipment: ExerciseEquipment,
  ) {
    this.id = id;
    this.name = name;
    this.category = category;
    this.primaryMuscleGroup = primaryMuscleGroup;
    this.equipment = equipment;
  }

  /**
   * Creates a new ExerciseCatalogEntry with invariants enforced:
   * - Name must be non-empty.
   * - Category must be valid.
   * - Equipment must be valid.
   */
  public static create(
    id: string,
    name: string,
    category: string,
    primaryMuscleGroup: string,
    equipment: string,
  ): ExerciseCatalogEntry {
    if (!name || name.trim().length === 0) {
      throw new ExerciseCatalogDomainError(
        ExerciseCatalogErrorCode.EXERCISE_NAME_REQUIRED,
        'Exercise name is required',
        { name },
      );
    }

    if (!VALID_CATEGORIES.includes(category as ExerciseCategory)) {
      throw new ExerciseCatalogDomainError(
        ExerciseCatalogErrorCode.EXERCISE_CATEGORY_INVALID,
        `Invalid exercise category: ${category}`,
        { category },
      );
    }

    if (!VALID_EQUIPMENT.includes(equipment as ExerciseEquipment)) {
      throw new ExerciseCatalogDomainError(
        ExerciseCatalogErrorCode.EXERCISE_EQUIPMENT_INVALID,
        `Invalid exercise equipment: ${equipment}`,
        { equipment },
      );
    }

    return new ExerciseCatalogEntry(
      id,
      name.trim(),
      category as ExerciseCategory,
      primaryMuscleGroup.trim(),
      equipment as ExerciseEquipment,
    );
  }

  /**
   * Reconstitutes an ExerciseCatalogEntry from persistence without re-running creation invariants.
   */
  public static reconstitute(
    id: string,
    name: string,
    category: ExerciseCategory,
    primaryMuscleGroup: string,
    equipment: ExerciseEquipment,
  ): ExerciseCatalogEntry {
    return new ExerciseCatalogEntry(
      id,
      name,
      category,
      primaryMuscleGroup,
      equipment,
    );
  }
}
