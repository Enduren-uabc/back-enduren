import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateTrainerLinkTables1746000000030 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS trainer_code VARCHAR(10) UNIQUE`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_users_trainer_code ON users(trainer_code) WHERE trainer_code IS NOT NULL`);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS trainer_link_requests (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        client_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        trainer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        status VARCHAR(20) NOT NULL DEFAULT 'pendiente'
          CHECK (status IN ('pendiente', 'aceptada', 'rechazada', 'cancelada')),
        message TEXT,
        rejection_reason TEXT,
        cancelled_at TIMESTAMP,
        responded_at TIMESTAMP,
        responded_by_id UUID REFERENCES users(id),
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_link_requests_client_status
        ON trainer_link_requests(client_id, status)
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_link_requests_trainer_status
        ON trainer_link_requests(trainer_id, status)
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_link_requests_created_at
        ON trainer_link_requests(created_at DESC)
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS trainer_links (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        client_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        trainer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        link_request_id UUID NOT NULL REFERENCES trainer_link_requests(id) ON DELETE CASCADE,
        status VARCHAR(20) NOT NULL DEFAULT 'active'
          CHECK (status IN ('active', 'inactive')),
        activated_at TIMESTAMP NOT NULL DEFAULT NOW(),
        deactivated_at TIMESTAMP,
        deactivation_reason TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_links_client_status
        ON trainer_links(client_id, status)
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_links_trainer_status
        ON trainer_links(trainer_id, status)
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS unq_active_link
        ON trainer_links(client_id, trainer_id)
        WHERE status = 'active'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS trainer_links CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS trainer_link_requests CASCADE`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_users_trainer_code`);
    await queryRunner.query(`ALTER TABLE users DROP COLUMN IF EXISTS trainer_code`);
  }
}
