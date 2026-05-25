import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddWorkoutSessionToPublications1768000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'publications',
      new TableColumn({
        name: 'workout_session_id',
        type: 'uuid',
        isNullable: true,
      }),
    );

    await queryRunner.addColumn(
      'publications',
      new TableColumn({
        name: 'exercise_summary',
        type: 'jsonb',
        isNullable: true,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('publications', 'exercise_summary');
    await queryRunner.dropColumn('publications', 'workout_session_id');
  }
}
