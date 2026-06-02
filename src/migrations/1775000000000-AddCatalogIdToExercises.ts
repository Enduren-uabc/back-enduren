import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCatalogIdToExercises1775000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE exercises
      ADD COLUMN "catalog_id" uuid NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE exercises
      DROP COLUMN "catalog_id"
    `);
  }
}
