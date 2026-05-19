import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddTargetFieldsToWorkoutSessionSets1746000000016 implements MigrationInterface {
  name = 'AddTargetFieldsToWorkoutSessionSets1746000000016';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'workout_session_sets',
      new TableColumn({
        name: 'target_reps',
        type: 'int',
        isNullable: true,
      }),
    );
    await queryRunner.addColumn(
      'workout_session_sets',
      new TableColumn({
        name: 'target_weight',
        type: 'float',
        isNullable: true,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('workout_session_sets', 'target_reps');
    await queryRunner.dropColumn('workout_session_sets', 'target_weight');
  }
}
