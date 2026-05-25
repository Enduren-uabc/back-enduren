import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreatePublicationMedia1770000000000 implements MigrationInterface {
  name = 'CreatePublicationMedia1770000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'publication_media',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
          },
          {
            name: 'publication_id',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'url',
            type: 'text',
          },
          {
            name: 'file_name',
            type: 'varchar',
            length: '255',
          },
          {
            name: 'file_size',
            type: 'integer',
          },
          {
            name: 'mime_type',
            type: 'varchar',
            length: '100',
          },
          {
            name: 'sort_order',
            type: 'integer',
            default: 0,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'now()',
          },
        ],
        foreignKeys: [
          {
            columnNames: ['publication_id'],
            referencedTableName: 'publications',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          },
        ],
      }),
    );

    await queryRunner.createIndex(
      'publication_media',
      new TableIndex({
        name: 'IDX_PUBLICATION_MEDIA_PUBLICATION_ID',
        columnNames: ['publication_id'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('publication_media');
  }
}
