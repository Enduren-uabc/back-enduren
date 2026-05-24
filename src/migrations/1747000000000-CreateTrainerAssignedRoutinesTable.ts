import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateTrainerAssignedRoutinesTable1747000000000 implements MigrationInterface {
  name = 'CreateTrainerAssignedRoutinesTable1747000000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE trainer_assigned_routines (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        trainer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        client_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        link_id UUID NOT NULL REFERENCES trainer_links(id) ON DELETE CASCADE,
        routine_id UUID NOT NULL REFERENCES routines(id) ON DELETE CASCADE,
        routine_snapshot JSONB NOT NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'active'
          CHECK (status IN ('active', 'inactive', 'replaced')),
        assigned_at TIMESTAMP NOT NULL DEFAULT NOW(),
        replaced_by_id UUID REFERENCES trainer_assigned_routines(id),
        notes TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);

    await queryRunner.query(`
      CREATE INDEX idx_assigned_routines_client_status
        ON trainer_assigned_routines(client_id, status)
    `);

    await queryRunner.query(`
      CREATE INDEX idx_assigned_routines_trainer
        ON trainer_assigned_routines(trainer_id)
    `);

    await queryRunner.query(`
      CREATE INDEX idx_assigned_routines_client_active
        ON trainer_assigned_routines(client_id)
        WHERE status = 'active'
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS idx_assigned_routines_client_active`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS idx_assigned_routines_trainer`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS idx_assigned_routines_client_status`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS trainer_assigned_routines`);
  }
}
