import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddRoutineAudienceAndWorkoutSessionSource1777000000000 implements MigrationInterface {
  name = 'AddRoutineAudienceAndWorkoutSessionSource1777000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "routines"
      ADD COLUMN IF NOT EXISTS "target_audience" varchar NOT NULL DEFAULT 'self'
    `);
    await queryRunner.query(`
      UPDATE "routines"
      SET "target_audience" = 'self'
      WHERE "target_audience" IS NULL
    `);
    await queryRunner.query(`
      ALTER TABLE "routines"
      ADD CONSTRAINT "CHK_routines_target_audience"
      CHECK ("target_audience" IN ('self', 'client'))
    `);

    await queryRunner.query(`
      ALTER TABLE "workout_sessions"
      ADD COLUMN IF NOT EXISTS "source_type" varchar NOT NULL DEFAULT 'personal'
    `);
    await queryRunner.query(`
      ALTER TABLE "workout_sessions"
      ADD COLUMN IF NOT EXISTS "assigned_routine_id" uuid NULL
    `);
    await queryRunner.query(`
      UPDATE "workout_sessions"
      SET "source_type" = 'personal'
      WHERE "source_type" IS NULL
    `);
    await queryRunner.query(`
      ALTER TABLE "workout_sessions"
      ADD CONSTRAINT "CHK_workout_sessions_source_type"
      CHECK ("source_type" IN ('personal', 'trainer_assigned'))
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "workout_sessions"
      DROP CONSTRAINT IF EXISTS "CHK_workout_sessions_source_type"
    `);
    await queryRunner.query(`
      ALTER TABLE "workout_sessions"
      DROP COLUMN IF EXISTS "assigned_routine_id"
    `);
    await queryRunner.query(`
      ALTER TABLE "workout_sessions"
      DROP COLUMN IF EXISTS "source_type"
    `);
    await queryRunner.query(`
      ALTER TABLE "routines"
      DROP CONSTRAINT IF EXISTS "CHK_routines_target_audience"
    `);
    await queryRunner.query(`
      ALTER TABLE "routines"
      DROP COLUMN IF EXISTS "target_audience"
    `);
  }
}
