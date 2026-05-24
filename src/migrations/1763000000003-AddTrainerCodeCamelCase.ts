import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTrainerCodeCamelCase1763000000003 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const exists = await queryRunner.query(
      `SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='trainer_code'`,
    );
    if (exists.length > 0) {
      await queryRunner.query(`ALTER TABLE users ADD COLUMN "trainerCode" varchar`);
      await queryRunner.query(`UPDATE users SET "trainerCode" = trainer_code`);
      await queryRunner.query(`ALTER TABLE users DROP COLUMN trainer_code`);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // No reverse needed
  }
}
