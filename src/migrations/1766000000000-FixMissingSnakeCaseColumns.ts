import { MigrationInterface, QueryRunner } from 'typeorm';

export class FixMissingSnakeCaseColumns1766000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE exercises RENAME COLUMN "order" TO exercise_order`,
    );

    await queryRunner.query(
      `ALTER TABLE user_profiles RENAME COLUMN "defaultTrainingStrategyKey" TO default_training_strategy_key`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE exercises RENAME COLUMN exercise_order TO "order"`,
    );

    await queryRunner.query(
      `ALTER TABLE user_profiles RENAME COLUMN default_training_strategy_key TO "defaultTrainingStrategyKey"`,
    );
  }
}
