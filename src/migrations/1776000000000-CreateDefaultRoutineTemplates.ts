import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateDefaultRoutineTemplates1776000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS default_routine_templates (
        id UUID PRIMARY KEY,
        experience_level VARCHAR(20) NOT NULL,
        split_key VARCHAR(20) NULL,
        name VARCHAR(100) NOT NULL,
        day_of_week VARCHAR(10) NOT NULL,
        display_order INT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS default_routine_template_exercises (
        id UUID PRIMARY KEY,
        template_id UUID NOT NULL REFERENCES default_routine_templates(id) ON DELETE CASCADE,
        exercise_catalog_id UUID NOT NULL REFERENCES exercise_catalog(id),
        exercise_name VARCHAR(100) NOT NULL,
        exercise_order INT NOT NULL,
        sets_count INT NOT NULL DEFAULT 3,
        initial_reps INT NOT NULL DEFAULT 10,
        initial_weight DECIMAL(5,2) NOT NULL DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_drt_level_split
      ON default_routine_templates(experience_level, split_key)
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_drt_exercises_template
      ON default_routine_template_exercises(template_id)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP TABLE IF EXISTS default_routine_template_exercises CASCADE
    `);
    await queryRunner.query(`
      DROP TABLE IF EXISTS default_routine_templates CASCADE
    `);
  }
}
