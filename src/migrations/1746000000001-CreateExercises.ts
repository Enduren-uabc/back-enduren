import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableColumn,
  TableForeignKey,
} from 'typeorm';

export class CreateExercises1746000000001 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'exercises',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true },
          { name: 'name', type: 'varchar', isNullable: false },
          { name: 'order', type: 'int', isNullable: false },
          { name: 'routineDayId', type: 'uuid', isNullable: false },
        ],
      }),
      true,
    );

    await queryRunner.createForeignKey(
      'exercises',
      new TableForeignKey({
        columnNames: ['routineDayId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'routine_days',
        onDelete: 'CASCADE',
      }),
    );

    // Remove the old exerciseCount column from routine_days since we now track exercises directly
    await queryRunner.dropColumn('routine_days', 'exerciseCount');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('exercises');
    await queryRunner.addColumn(
      'routine_days',
      new TableColumn({
        name: 'exerciseCount',
        type: 'int',
        default: 0,
      }),
    );
  }
}
