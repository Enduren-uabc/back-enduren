import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateAdvancedStatusAndAuditTables1746000000024 implements MigrationInterface {
  name = 'CreateAdvancedStatusAndAuditTables1746000000024';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS trainer_verification_advanced_status (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        trainer_verification_id UUID NOT NULL REFERENCES trainer_verifications(id) ON DELETE CASCADE,
        advanced_status VARCHAR(40) NOT NULL DEFAULT 'draft',
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_advanced_status_verification
      ON trainer_verification_advanced_status(trainer_verification_id)
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS trainer_verification_status_history (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        trainer_verification_id UUID NOT NULL REFERENCES trainer_verifications(id) ON DELETE CASCADE,
        previous_status VARCHAR(40),
        new_status VARCHAR(40) NOT NULL,
        actor_id UUID NOT NULL,
        actor_type VARCHAR(20) NOT NULL DEFAULT 'system',
        reason TEXT,
        metadata JSONB,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_status_history_verification
      ON trainer_verification_status_history(trainer_verification_id)
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_status_history_created
      ON trainer_verification_status_history(created_at DESC)
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS trainer_verification_audit_events (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        trainer_verification_id UUID NOT NULL REFERENCES trainer_verifications(id) ON DELETE CASCADE,
        event_type VARCHAR(40) NOT NULL,
        actor_id UUID NOT NULL,
        actor_type VARCHAR(20) NOT NULL DEFAULT 'system',
        description TEXT NOT NULL,
        metadata JSONB,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_audit_events_verification
      ON trainer_verification_audit_events(trainer_verification_id)
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_audit_events_type
      ON trainer_verification_audit_events(event_type)
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_audit_events_created
      ON trainer_verification_audit_events(created_at DESC)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP TABLE IF EXISTS trainer_verification_audit_events`,
    );
    await queryRunner.query(
      `DROP TABLE IF EXISTS trainer_verification_status_history`,
    );
    await queryRunner.query(
      `DROP TABLE IF EXISTS trainer_verification_advanced_status`,
    );
  }
}
