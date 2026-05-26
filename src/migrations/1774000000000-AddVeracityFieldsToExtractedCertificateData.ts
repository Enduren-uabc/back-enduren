import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddVeracityFieldsToExtractedCertificateData1774000000000 implements MigrationInterface {
  name = 'AddVeracityFieldsToExtractedCertificateData1774000000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    const tableName = 'extracted_certificate_data';

    const hasVeracityCodeColumn = await queryRunner.hasColumn(
      tableName,
      'has_veracity_code',
    );
    if (!hasVeracityCodeColumn) {
      await queryRunner.addColumn(
        tableName,
        new TableColumn({
          name: 'has_veracity_code',
          type: 'boolean',
          isNullable: true,
        }),
      );
    }

    const hasVeracityCodeValueColumn = await queryRunner.hasColumn(
      tableName,
      'veracity_code',
    );
    if (!hasVeracityCodeValueColumn) {
      await queryRunner.addColumn(
        tableName,
        new TableColumn({
          name: 'veracity_code',
          type: 'varchar',
          length: '100',
          isNullable: true,
        }),
      );
    }
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    const tableName = 'extracted_certificate_data';

    const hasVeracityCodeValueColumn = await queryRunner.hasColumn(
      tableName,
      'veracity_code',
    );
    if (hasVeracityCodeValueColumn) {
      await queryRunner.dropColumn(tableName, 'veracity_code');
    }

    const hasVeracityCodeColumn = await queryRunner.hasColumn(
      tableName,
      'has_veracity_code',
    );
    if (hasVeracityCodeColumn) {
      await queryRunner.dropColumn(tableName, 'has_veracity_code');
    }
  }
}
