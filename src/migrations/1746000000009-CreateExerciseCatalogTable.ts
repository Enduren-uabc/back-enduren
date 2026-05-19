import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class CreateExerciseCatalogTable1746000000009 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'exercise_catalog',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true },
          { name: 'name', type: 'varchar', isNullable: false },
          { name: 'category', type: 'varchar', isNullable: false },
          { name: 'primaryMuscleGroup', type: 'varchar', isNullable: false },
          { name: 'equipment', type: 'varchar', isNullable: false },
        ],
      }),
      true,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('exercise_catalog');
  }
}
