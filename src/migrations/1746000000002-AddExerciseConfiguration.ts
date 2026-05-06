import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddExerciseConfiguration1746000000002 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'exercises',
      new TableColumn({
        name: 'sets',
        type: 'int',
        isNullable: true,
      }),
    );

    await queryRunner.addColumn(
      'exercises',
      new TableColumn({
        name: 'repsPerSet',
        type: 'int',
        isNullable: true,
      }),
    );

    await queryRunner.addColumn(
      'exercises',
      new TableColumn({
        name: 'weight',
        type: 'float',
        isNullable: true,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('exercises', 'weight');
    await queryRunner.dropColumn('exercises', 'repsPerSet');
    await queryRunner.dropColumn('exercises', 'sets');
  }
}
