import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
} from 'typeorm';

export class CreateRoutinesAndRoutineDays1746000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'routines',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true },
          { name: 'name', type: 'varchar', isNullable: false },
          { name: 'userId', type: 'uuid', isNullable: false },
          { name: 'createdAt', type: 'timestamp', default: 'now()' },
          { name: 'updatedAt', type: 'timestamp', default: 'now()' },
        ],
      }),
      true,
    );

    await queryRunner.createTable(
      new Table({
        name: 'routine_days',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true },
          { name: 'dayOfWeek', type: 'varchar', isNullable: false },
          { name: 'exerciseCount', type: 'int', default: 0 },
          { name: 'routineId', type: 'uuid', isNullable: false },
        ],
      }),
      true,
    );

    await queryRunner.createForeignKey(
      'routine_days',
      new TableForeignKey({
        columnNames: ['routineId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'routines',
        onDelete: 'CASCADE',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('routine_days');
    await queryRunner.dropTable('routines');
  }
}
