import {
  MigrationInterface,
  QueryRunner,
  TableColumn,
  TableIndex,
} from 'typeorm';

export class AddSocialAuthFields1748000000000 implements MigrationInterface {
  name = 'AddSocialAuthFields1748000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'users',
      new TableColumn({
        name: 'authProvider',
        type: 'varchar',
        length: '10',
        isNullable: true,
      }),
    );

    await queryRunner.addColumn(
      'users',
      new TableColumn({
        name: 'socialId',
        type: 'varchar',
        length: '255',
        isNullable: true,
      }),
    );

    await queryRunner.addColumn(
      'users',
      new TableColumn({
        name: 'privacyAccepted',
        type: 'boolean',
        default: false,
      }),
    );

    await queryRunner.addColumn(
      'users',
      new TableColumn({
        name: 'avatarUrl',
        type: 'varchar',
        length: '500',
        isNullable: true,
      }),
    );

    await queryRunner.createIndex(
      'users',
      new TableIndex({
        name: 'IDX_USERS_SOCIAL',
        columnNames: ['authProvider', 'socialId'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropIndex('users', 'IDX_USERS_SOCIAL');
    await queryRunner.dropColumn('users', 'avatarUrl');
    await queryRunner.dropColumn('users', 'privacyAccepted');
    await queryRunner.dropColumn('users', 'socialId');
    await queryRunner.dropColumn('users', 'authProvider');
  }
}
