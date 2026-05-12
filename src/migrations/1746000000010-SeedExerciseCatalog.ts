import { MigrationInterface, QueryRunner } from 'typeorm';

export class SeedExerciseCatalog1746000000010 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const exercises = [
      {
        id: 'ec-001',
        name: 'Press Banca',
        category: 'chest',
        primaryMuscleGroup: 'Pectoral Mayor',
        equipment: 'barbell',
      },
      {
        id: 'ec-002',
        name: 'Press Banca Inclinado',
        category: 'chest',
        primaryMuscleGroup: 'Pectoral Superior',
        equipment: 'barbell',
      },
      {
        id: 'ec-003',
        name: 'Aperturas con Mancuerna',
        category: 'chest',
        primaryMuscleGroup: 'Pectoral Mayor',
        equipment: 'dumbbell',
      },
      {
        id: 'ec-004',
        name: 'Sentadilla',
        category: 'legs',
        primaryMuscleGroup: 'Cuádriceps',
        equipment: 'barbell',
      },
      {
        id: 'ec-005',
        name: 'Sentadilla Frontal',
        category: 'legs',
        primaryMuscleGroup: 'Cuádriceps',
        equipment: 'barbell',
      },
      {
        id: 'ec-006',
        name: 'Prensa de Piernas',
        category: 'legs',
        primaryMuscleGroup: 'Cuádriceps',
        equipment: 'machine',
      },
      {
        id: 'ec-007',
        name: 'Peso Muerto',
        category: 'back',
        primaryMuscleGroup: 'Espalda Baja',
        equipment: 'barbell',
      },
      {
        id: 'ec-008',
        name: 'Dominadas',
        category: 'back',
        primaryMuscleGroup: 'Dorsal Ancho',
        equipment: 'bodyweight',
      },
      {
        id: 'ec-009',
        name: 'Remo con Barra',
        category: 'back',
        primaryMuscleGroup: 'Dorsal Ancho',
        equipment: 'barbell',
      },
      {
        id: 'ec-010',
        name: 'Remo en Polea Baja',
        category: 'back',
        primaryMuscleGroup: 'Dorsal Ancho',
        equipment: 'cable',
      },
      {
        id: 'ec-011',
        name: 'Press Militar',
        category: 'shoulders',
        primaryMuscleGroup: 'Deltoides',
        equipment: 'barbell',
      },
      {
        id: 'ec-012',
        name: 'Elevaciones Laterales',
        category: 'shoulders',
        primaryMuscleGroup: 'Deltoides Laterales',
        equipment: 'dumbbell',
      },
      {
        id: 'ec-013',
        name: 'Curl de Bíceps con Barra',
        category: 'arms',
        primaryMuscleGroup: 'Bíceps',
        equipment: 'barbell',
      },
      {
        id: 'ec-014',
        name: 'Curl Martillo',
        category: 'arms',
        primaryMuscleGroup: 'Bíceps',
        equipment: 'dumbbell',
      },
      {
        id: 'ec-015',
        name: 'Extensiones de Tríceps en Polea',
        category: 'arms',
        primaryMuscleGroup: 'Tríceps',
        equipment: 'cable',
      },
      {
        id: 'ec-016',
        name: 'Fondos en Paralelas',
        category: 'chest',
        primaryMuscleGroup: 'Pectoral Mayor',
        equipment: 'bodyweight',
      },
      {
        id: 'ec-017',
        name: 'Plancha',
        category: 'core',
        primaryMuscleGroup: 'Abdominales',
        equipment: 'bodyweight',
      },
      {
        id: 'ec-018',
        name: 'Crunch Abdominal',
        category: 'core',
        primaryMuscleGroup: 'Abdominales',
        equipment: 'bodyweight',
      },
      {
        id: 'ec-019',
        name: 'Peso Muerto Rumano',
        category: 'legs',
        primaryMuscleGroup: 'Isquiotibiales',
        equipment: 'barbell',
      },
      {
        id: 'ec-020',
        name: 'Curl de Piernas',
        category: 'legs',
        primaryMuscleGroup: 'Isquiotibiales',
        equipment: 'machine',
      },
      {
        id: 'ec-021',
        name: 'Elevación de Talones',
        category: 'legs',
        primaryMuscleGroup: 'Gemelos',
        equipment: 'machine',
      },
      {
        id: 'ec-022',
        name: 'Face Pull',
        category: 'shoulders',
        primaryMuscleGroup: 'Deltoides Posterior',
        equipment: 'cable',
      },
      {
        id: 'ec-023',
        name: 'Swing de Pesa Rusa',
        category: 'legs',
        primaryMuscleGroup: 'Glúteos',
        equipment: 'kettlebell',
      },
      {
        id: 'ec-024',
        name: 'Carrera en Cinta',
        category: 'cardio',
        primaryMuscleGroup: 'Piernas',
        equipment: 'machine',
      },
      {
        id: 'ec-025',
        name: 'Burpees',
        category: 'cardio',
        primaryMuscleGroup: 'Cuerpo Completo',
        equipment: 'bodyweight',
      },
    ];

    for (const ex of exercises) {
      await queryRunner.query(
        `INSERT INTO exercise_catalog (id, name, category, "primaryMuscleGroup", equipment)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (id) DO NOTHING`,
        [ex.id, ex.name, ex.category, ex.primaryMuscleGroup, ex.equipment],
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DELETE FROM exercise_catalog WHERE id LIKE 'ec-%'`,
    );
  }
}
