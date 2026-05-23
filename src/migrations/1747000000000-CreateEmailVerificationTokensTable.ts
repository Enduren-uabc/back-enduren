import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreateEmailVerificationTokensTable1747000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'email_verification_tokens',
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

    await queryRunner.createIndex('email_verification_tokens', new TableIndex({
      name: 'IDX_EMAIL_VERIFICATION_TOKEN',
      columnNames: ['token'],
      isUnique: true,
    }));

    await queryRunner.createIndex('email_verification_tokens', new TableIndex({
      name: 'IDX_EMAIL_VERIFICATION_USER_ID',
      columnNames: ['userId'],
    }));
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('email_verification_tokens');
  }
}
