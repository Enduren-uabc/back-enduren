import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddRoutineIsActive1746000000005 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'routines',
      new TableColumn({
        name: 'isActive',
        type: 'boolean',
        default: false,
        isNullable: false,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('routines', 'isActive');
  }
}
