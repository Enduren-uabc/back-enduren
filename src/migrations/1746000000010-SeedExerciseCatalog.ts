import { MigrationInterface, QueryRunner } from 'typeorm';

export class SeedExerciseCatalog1746000000010 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const exercises = [
      {
        id: '00000000-0000-4000-8000-000000000001',
        name: 'Press Banca',
        category: 'chest',
        primaryMuscleGroup: 'Pectoral Mayor',
        equipment: 'barbell',
      },
      {
        id: '00000000-0000-4000-8000-000000000002',
        name: 'Press Banca Inclinado',
        category: 'chest',
        primaryMuscleGroup: 'Pectoral Superior',
        equipment: 'barbell',
      },
      {
        id: '00000000-0000-4000-8000-000000000003',
        name: 'Aperturas con Mancuerna',
        category: 'chest',
        primaryMuscleGroup: 'Pectoral Mayor',
        equipment: 'dumbbell',
      },
      {
        id: '00000000-0000-4000-8000-000000000004',
        name: 'Sentadilla',
        category: 'legs',
        primaryMuscleGroup: 'Cuádriceps',
        equipment: 'barbell',
      },
      {
        id: '00000000-0000-4000-8000-000000000005',
        name: 'Sentadilla Frontal',
        category: 'legs',
        primaryMuscleGroup: 'Cuádriceps',
        equipment: 'barbell',
      },
      {
        id: '00000000-0000-4000-8000-000000000006',
        name: 'Prensa de Piernas',
        category: 'legs',
        primaryMuscleGroup: 'Cuádriceps',
        equipment: 'machine',
      },
      {
        id: '00000000-0000-4000-8000-000000000007',
        name: 'Peso Muerto',
        category: 'back',
        primaryMuscleGroup: 'Espalda Baja',
        equipment: 'barbell',
      },
      {
        id: '00000000-0000-4000-8000-000000000008',
        name: 'Dominadas',
        category: 'back',
        primaryMuscleGroup: 'Dorsal Ancho',
        equipment: 'bodyweight',
      },
      {
        id: '00000000-0000-4000-8000-000000000009',
        name: 'Remo con Barra',
        category: 'back',
        primaryMuscleGroup: 'Dorsal Ancho',
        equipment: 'barbell',
      },
      {
        id: '00000000-0000-4000-8000-000000000010',
        name: 'Remo en Polea Baja',
        category: 'back',
        primaryMuscleGroup: 'Dorsal Ancho',
        equipment: 'cable',
      },
      {
        id: '00000000-0000-4000-8000-000000000011',
        name: 'Press Militar',
        category: 'shoulders',
        primaryMuscleGroup: 'Deltoides',
        equipment: 'barbell',
      },
      {
        id: '00000000-0000-4000-8000-000000000012',
        name: 'Elevaciones Laterales',
        category: 'shoulders',
        primaryMuscleGroup: 'Deltoides Laterales',
        equipment: 'dumbbell',
      },
      {
        id: '00000000-0000-4000-8000-000000000013',
        name: 'Curl de Bíceps con Barra',
        category: 'arms',
        primaryMuscleGroup: 'Bíceps',
        equipment: 'barbell',
      },
      {
        id: '00000000-0000-4000-8000-000000000014',
        name: 'Curl Martillo',
        category: 'arms',
        primaryMuscleGroup: 'Bíceps',
        equipment: 'dumbbell',
      },
      {
        id: '00000000-0000-4000-8000-000000000015',
        name: 'Extensiones de Tríceps en Polea',
        category: 'arms',
        primaryMuscleGroup: 'Tríceps',
        equipment: 'cable',
      },
      {
        id: '00000000-0000-4000-8000-000000000016',
        name: 'Fondos en Paralelas',
        category: 'chest',
        primaryMuscleGroup: 'Pectoral Mayor',
        equipment: 'bodyweight',
      },
      {
        id: '00000000-0000-4000-8000-000000000017',
        name: 'Plancha',
        category: 'core',
        primaryMuscleGroup: 'Abdominales',
        equipment: 'bodyweight',
      },
      {
        id: '00000000-0000-4000-8000-000000000018',
        name: 'Crunch Abdominal',
        category: 'core',
        primaryMuscleGroup: 'Abdominales',
        equipment: 'bodyweight',
      },
      {
        id: '00000000-0000-4000-8000-000000000019',
        name: 'Peso Muerto Rumano',
        category: 'legs',
        primaryMuscleGroup: 'Isquiotibiales',
        equipment: 'barbell',
      },
      {
        id: '00000000-0000-4000-8000-000000000020',
        name: 'Curl de Piernas',
        category: 'legs',
        primaryMuscleGroup: 'Isquiotibiales',
        equipment: 'machine',
      },
      {
        id: '00000000-0000-4000-8000-000000000021',
        name: 'Elevación de Talones',
        category: 'legs',
        primaryMuscleGroup: 'Gemelos',
        equipment: 'machine',
      },
      {
        id: '00000000-0000-4000-8000-000000000022',
        name: 'Face Pull',
        category: 'shoulders',
        primaryMuscleGroup: 'Deltoides Posterior',
        equipment: 'cable',
      },
      {
        id: '00000000-0000-4000-8000-000000000023',
        name: 'Swing de Pesa Rusa',
        category: 'legs',
        primaryMuscleGroup: 'Glúteos',
        equipment: 'kettlebell',
      },
      {
        id: '00000000-0000-4000-8000-000000000024',
        name: 'Carrera en Cinta',
        category: 'cardio',
        primaryMuscleGroup: 'Piernas',
        equipment: 'machine',
      },
      {
        id: '00000000-0000-4000-8000-000000000025',
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
      `DELETE FROM exercise_catalog WHERE CAST(id AS TEXT) LIKE '00000000-0000-4000-8000-%'`,
    );
  }
}
