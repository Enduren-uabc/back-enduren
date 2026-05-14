import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddMediaFieldsToExerciseCatalog1746000000017 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumns('exercise_catalog', [
      new TableColumn({
        name: 'videoUrl',
        type: 'varchar',
        isNullable: true,
      }),
      new TableColumn({
        name: 'imageUrl',
        type: 'varchar',
        isNullable: true,
      }),
    ]);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumns('exercise_catalog', ['videoUrl', 'imageUrl']);
  }
}
