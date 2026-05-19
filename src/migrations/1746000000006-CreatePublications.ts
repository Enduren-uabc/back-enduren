import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreatePublications1746000000006 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'publications',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true },
          { name: 'authorUserId', type: 'uuid', isNullable: false },
          { name: 'title', type: 'varchar', length: '120', isNullable: false },
          {
            name: 'content',
            type: 'varchar',
            length: '2000',
            isNullable: false,
          },
          { name: 'createdAt', type: 'timestamp', default: 'now()' },
          { name: 'updatedAt', type: 'timestamp', default: 'now()' },
        ],
      }),
      true,
    );

    await queryRunner.createIndex(
      'publications',
      new TableIndex({
        name: 'IDX_publications_authorUserId',
        columnNames: ['authorUserId'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropIndex(
      'publications',
      'IDX_publications_authorUserId',
    );
    await queryRunner.dropTable('publications');
  }
}
