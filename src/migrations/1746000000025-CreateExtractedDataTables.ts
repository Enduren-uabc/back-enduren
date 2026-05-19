import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
  TableIndex,
} from 'typeorm';

export class CreateExtractedDataTables1746000000025 implements MigrationInterface {
  name = 'CreateExtractedDataTables1746000000025';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'extracted_certificate_data',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true },
          { name: 'verification_id', type: 'uuid' },
          { name: 'full_name', type: 'varchar', length: '255' },
          { name: 'certificate_name', type: 'varchar', length: '255' },
          { name: 'issuing_organization', type: 'varchar', length: '255' },
          { name: 'issue_date', type: 'date', isNullable: true },
          { name: 'expiration_date', type: 'date', isNullable: true },
          {
            name: 'folio_number',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
          { name: 'qr_url', type: 'varchar', length: '500', isNullable: true },
          { name: 'ocr_confidence', type: 'float' },
          { name: 'created_at', type: 'timestamp', default: 'now()' },
        ],
      }),
      true,
    );

    await queryRunner.createTable(
      new Table({
        name: 'extracted_id_data',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true },
          { name: 'verification_id', type: 'uuid' },
          { name: 'full_name', type: 'varchar', length: '255' },
          { name: 'document_type', type: 'varchar', length: '50' },
          {
            name: 'issuing_country',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
          { name: 'birth_date', type: 'date', isNullable: true },
          { name: 'expiration_date', type: 'date', isNullable: true },
          {
            name: 'document_identifier',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
          { name: 'ocr_confidence', type: 'float' },
          { name: 'created_at', type: 'timestamp', default: 'now()' },
        ],
      }),
      true,
    );

    await queryRunner.createForeignKey(
      'extracted_certificate_data',
      new TableForeignKey({
        columnNames: ['verification_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'trainer_verifications',
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'extracted_id_data',
      new TableForeignKey({
        columnNames: ['verification_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'trainer_verifications',
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createIndex(
      'extracted_certificate_data',
      new TableIndex({
        name: 'IDX_extracted_cert_verification',
        columnNames: ['verification_id'],
      }),
    );

    await queryRunner.createIndex(
      'extracted_id_data',
      new TableIndex({
        name: 'IDX_extracted_id_verification',
        columnNames: ['verification_id'],
      }),
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('extracted_id_data');
    await queryRunner.dropTable('extracted_certificate_data');
  }
}
