import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreatePasswordResetTokensTable1747000000001 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'password_reset_tokens',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true },
          { name: 'userId', type: 'uuid' },
          { name: 'token', type: 'varchar', length: '6' },
          { name: 'expiresAt', type: 'timestamp' },
          { name: 'usedAt', type: 'timestamp', isNullable: true },
          { name: 'createdAt', type: 'timestamp', default: 'now()' },
        ],
      }),
      true,
    );

    await queryRunner.createIndex('password_reset_tokens', new TableIndex({
      name: 'IDX_PASSWORD_RESET_TOKEN',
      columnNames: ['token'],
      isUnique: true,
    }));

    await queryRunner.createIndex('password_reset_tokens', new TableIndex({
      name: 'IDX_PASSWORD_RESET_USER_ID',
      columnNames: ['userId'],
    }));
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('password_reset_tokens');
  }
}
