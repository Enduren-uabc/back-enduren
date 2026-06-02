import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddCurpToExtractedIdData1772000000000 implements MigrationInterface {
  name = 'AddCurpToExtractedIdData1772000000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'extracted_id_data',
      new TableColumn({
        name: 'curp',
        type: 'varchar',
        length: '18',
        isNullable: true,
      }),
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('extracted_id_data', 'curp');
  }
}
