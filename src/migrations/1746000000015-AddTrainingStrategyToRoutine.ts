import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddTrainingStrategyToRoutine1746000000015 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'routines',
      new TableColumn({
        name: 'trainingStrategyKey',
        type: 'varchar',
        isNullable: true,
        default: null,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('routines', 'trainingStrategyKey');
  }
}
