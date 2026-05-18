import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddStorageContainerToTrainerVerificationFiles1746000000023 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE trainer_id_documents
      ADD COLUMN IF NOT EXISTS container_name VARCHAR(100) NOT NULL DEFAULT 'trainer-verification-docs'
    `);

    await queryRunner.query(`
      ALTER TABLE trainer_certificates
      ADD COLUMN IF NOT EXISTS container_name VARCHAR(100) NOT NULL DEFAULT 'trainer-verification-docs'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE trainer_certificates
      DROP COLUMN IF EXISTS container_name
    `);

    await queryRunner.query(`
      ALTER TABLE trainer_id_documents
      DROP COLUMN IF EXISTS container_name
    `);
  }
}
