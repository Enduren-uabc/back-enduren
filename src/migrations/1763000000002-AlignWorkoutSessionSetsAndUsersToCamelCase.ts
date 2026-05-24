import { MigrationInterface, QueryRunner } from 'typeorm';

export class AlignWorkoutSessionSetsAndUsersToCamelCase1763000000002 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // === workout_session_sets — target_reps/target_weight → camelCase ===
    await queryRunner.query(`ALTER TABLE workout_session_sets ADD COLUMN "targetReps" integer`);
    await queryRunner.query(`ALTER TABLE workout_session_sets ADD COLUMN "targetWeight" float`);
    await queryRunner.query(`UPDATE workout_session_sets SET "targetReps" = target_reps, "targetWeight" = target_weight`);
    await queryRunner.query(`ALTER TABLE workout_session_sets DROP COLUMN target_reps`);
    await queryRunner.query(`ALTER TABLE workout_session_sets DROP COLUMN target_weight`);

    // === users — failed_login_attempts/locked_until → camelCase ===
    await queryRunner.query(`ALTER TABLE users ADD COLUMN "failedLoginAttempts" integer DEFAULT 0`);
    await queryRunner.query(`ALTER TABLE users ADD COLUMN "lockedUntil" timestamp`);
    await queryRunner.query(`UPDATE users SET "failedLoginAttempts" = failed_login_attempts, "lockedUntil" = locked_until`);
    await queryRunner.query(`ALTER TABLE users DROP COLUMN failed_login_attempts`);
    await queryRunner.query(`ALTER TABLE users DROP COLUMN locked_until`);
    await queryRunner.query(`ALTER TABLE users ALTER COLUMN "failedLoginAttempts" SET NOT NULL`);
    await queryRunner.query(`ALTER TABLE users ALTER COLUMN "failedLoginAttempts" SET DEFAULT 0`);

    // === users — trainer_code → trainerCode ===
    const hasTrainerCode = await queryRunner.query(
      `SELECT column_name FROM information_schema.columns WHERE table_name='users' AND column_name='trainer_code'`,
    );
    if (hasTrainerCode.length > 0) {
      await queryRunner.query(`ALTER TABLE users ADD COLUMN "trainerCode" varchar`);
      await queryRunner.query(`UPDATE users SET "trainerCode" = trainer_code`);
      await queryRunner.query(`ALTER TABLE users DROP COLUMN trainer_code`);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Simplified reverse
  }
}
