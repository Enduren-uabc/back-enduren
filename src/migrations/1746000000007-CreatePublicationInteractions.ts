import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
  TableIndex,
  TableUnique,
} from 'typeorm';

export class CreatePublicationInteractions1746000000007 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'publication_reactions',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true },
          { name: 'publicationId', type: 'uuid', isNullable: false },
          { name: 'authorUserId', type: 'uuid', isNullable: false },
          { name: 'createdAt', type: 'timestamp', default: 'now()' },
        ],
      }),
      true,
    );

    await queryRunner.createTable(
      new Table({
        name: 'publication_comments',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true },
          { name: 'publicationId', type: 'uuid', isNullable: false },
          { name: 'authorUserId', type: 'uuid', isNullable: false },
          {
            name: 'content',
            type: 'varchar',
            length: '500',
            isNullable: false,
          },
          { name: 'createdAt', type: 'timestamp', default: 'now()' },
        ],
      }),
      true,
    );

    await queryRunner.createForeignKey(
      'publication_reactions',
      new TableForeignKey({
        columnNames: ['publicationId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'publications',
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'publication_comments',
      new TableForeignKey({
        columnNames: ['publicationId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'publications',
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createUniqueConstraint(
      'publication_reactions',
      new TableUnique({
        name: 'UQ_publication_reactions_publication_author',
        columnNames: ['publicationId', 'authorUserId'],
      }),
    );

    await queryRunner.createIndex(
      'publication_reactions',
      new TableIndex({
        name: 'IDX_publication_reactions_publicationId',
        columnNames: ['publicationId'],
      }),
    );

    await queryRunner.createIndex(
      'publication_comments',
      new TableIndex({
        name: 'IDX_publication_comments_publicationId',
        columnNames: ['publicationId'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('publication_comments');
    await queryRunner.dropTable('publication_reactions');
  }
}
