import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddTargetSetsToWorkoutSessionExercises1746000000021 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add targetSets JSON column
    await queryRunner.addColumn(
      'workout_session_exercises',
      new TableColumn({
        name: 'targetSets',
        type: 'text',
        isNullable: true,
      }),
    );

    // Drop old columns that are no longer in the entity
    await queryRunner.dropColumn('workout_session_exercises', 'sets');
    await queryRunner.dropColumn('workout_session_exercises', 'repsPerSet');
    await queryRunner.dropColumn('workout_session_exercises', 'weight');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Restore old columns
    await queryRunner.addColumn(
      'workout_session_exercises',
      new TableColumn({
        name: 'sets',
        type: 'int',
      }),
    );
    await queryRunner.addColumn(
      'workout_session_exercises',
      new TableColumn({
        name: 'repsPerSet',
        type: 'int',
      }),
    );
    await queryRunner.addColumn(
      'workout_session_exercises',
      new TableColumn({
        name: 'weight',
        type: 'float',
      }),
    );

    // Drop targetSets
    await queryRunner.dropColumn('workout_session_exercises', 'targetSets');
  }
}
