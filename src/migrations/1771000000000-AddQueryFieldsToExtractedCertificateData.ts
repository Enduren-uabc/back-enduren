import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddQueryFieldsToExtractedCertificateData1771000000000 implements MigrationInterface {
  name = 'AddQueryFieldsToExtractedCertificateData1771000000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumns('extracted_certificate_data', [
      new TableColumn({
        name: 'curp',
        type: 'varchar',
        length: '18',
        isNullable: true,
      }),
      new TableColumn({
        name: 'document_type',
        type: 'varchar',
        length: '50',
        isNullable: true,
      }),
      new TableColumn({
        name: 'certifying_institution',
        type: 'varchar',
        length: '255',
        isNullable: true,
      }),
      new TableColumn({
        name: 'competency_standard_code',
        type: 'varchar',
        length: '50',
        isNullable: true,
      }),
      new TableColumn({
        name: 'competency_standard_name',
        type: 'varchar',
        length: '500',
        isNullable: true,
      }),
    ]);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumns('extracted_certificate_data', [
      'curp',
      'document_type',
      'certifying_institution',
      'competency_standard_code',
      'competency_standard_name',
    ]);
  }
}
