import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
} from 'typeorm';

export class CreateExerciseSetsTable1746000000011 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'exercise_sets',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
          },
          {
            name: 'exerciseId',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'setNumber',
            type: 'int',
            isNullable: false,
          },
          {
            name: 'reps',
            type: 'int',
            isNullable: false,
          },
          {
            name: 'weight',
            type: 'float',
            isNullable: false,
          },
          {
            name: 'restSeconds',
            type: 'int',
            isNullable: true,
          },
        ],
      }),
    );

    await queryRunner.createForeignKey(
      'exercise_sets',
      new TableForeignKey({
        columnNames: ['exerciseId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'exercises',
        onDelete: 'CASCADE',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('exercise_sets');
    if (table) {
      const fk = table.foreignKeys.find(
        (fk) => fk.columnNames.indexOf('exerciseId') !== -1,
      );
      if (fk) {
        await queryRunner.dropForeignKey('exercise_sets', fk);
      }
    }
    await queryRunner.dropTable('exercise_sets');
  }
}
