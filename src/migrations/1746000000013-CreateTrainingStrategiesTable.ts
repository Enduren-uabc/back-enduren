import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class CreateTrainingStrategiesTable1746000000013 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'training_strategies',
        columns: [
          {
            name: 'key',
            type: 'varchar',
            isPrimary: true,
          },
          {
            name: 'name',
            type: 'varchar',
          },
          {
            name: 'description',
            type: 'text',
          },
          {
            name: 'rules',
            type: 'text',
          },
        ],
      }),
      true,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('training_strategies');
  }
}
