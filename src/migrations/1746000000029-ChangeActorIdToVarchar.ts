import { MigrationInterface, QueryRunner } from 'typeorm';

export class ChangeActorIdToVarchar1746000000029 implements MigrationInterface {
  name = 'ChangeActorIdToVarchar1746000000029';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE trainer_verification_status_history
      ALTER COLUMN actor_id TYPE VARCHAR(36)
    `);

    await queryRunner.query(`
      ALTER TABLE trainer_verification_audit_events
      ALTER COLUMN actor_id TYPE VARCHAR(36)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE trainer_verification_audit_events
      ALTER COLUMN actor_id TYPE UUID USING actor_id::uuid
    `);

    await queryRunner.query(`
      ALTER TABLE trainer_verification_status_history
      ALTER COLUMN actor_id TYPE UUID USING actor_id::uuid
    `);
  }
}
