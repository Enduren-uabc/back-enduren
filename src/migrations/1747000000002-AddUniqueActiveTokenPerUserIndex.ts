import { MigrationInterface, QueryRunner, TableIndex } from 'typeorm';

export class AddUniqueActiveTokenPerUserIndex1747000000002 implements MigrationInterface {
  name = 'AddUniqueActiveTokenPerUserIndex1747000000002';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createIndex('password_reset_tokens', new TableIndex({
      name: 'IDX_UNIQUE_ACTIVE_TOKEN_PER_USER',
      columnNames: ['userId'],
      isUnique: true,
      where: '"usedAt" IS NULL',
    }));
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropIndex('password_reset_tokens', 'IDX_UNIQUE_ACTIVE_TOKEN_PER_USER');
  }
}
