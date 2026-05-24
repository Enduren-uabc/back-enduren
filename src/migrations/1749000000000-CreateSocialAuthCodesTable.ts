import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreateSocialAuthCodesTable1749000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'social_auth_codes',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true },
          { name: 'code', type: 'varchar', length: '64' },
          { name: 'userId', type: 'uuid' },
          { name: 'provider', type: 'varchar' },
          { name: 'expiresAt', type: 'timestamp' },
          { name: 'usedAt', type: 'timestamp', isNullable: true },
          { name: 'createdAt', type: 'timestamp', default: 'now()' },
        ],
      }),
      true,
    );

    await queryRunner.createIndex(
      'social_auth_codes',
      new TableIndex({
        name: 'IDX_SOCIAL_AUTH_CODE',
        columnNames: ['code'],
        isUnique: true,
      }),
    );

    await queryRunner.createIndex(
      'social_auth_codes',
      new TableIndex({
        name: 'IDX_SOCIAL_AUTH_CODE_USER_ID',
        columnNames: ['userId'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('social_auth_codes');
  }
}
