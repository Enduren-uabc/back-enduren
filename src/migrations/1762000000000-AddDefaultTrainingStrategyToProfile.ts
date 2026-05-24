import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddDefaultTrainingStrategyToProfile1762000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE user_profiles
      ADD COLUMN "defaultTrainingStrategyKey" varchar NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE user_profiles
      DROP COLUMN "defaultTrainingStrategyKey"
    `);
  }
}
