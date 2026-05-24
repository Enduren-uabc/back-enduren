import { MigrationInterface, QueryRunner } from 'typeorm';

export class AlignTrainerLinkToCamelCase1763000000001 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // === trainer_link_requests (was created with snake_case columns) ===
    // The entities already use camelCase property names, so DB must match
    await queryRunner.query(`ALTER TABLE trainer_link_requests ADD COLUMN "clientId" uuid`);
    await queryRunner.query(`ALTER TABLE trainer_link_requests ADD COLUMN "trainerId" uuid`);
    await queryRunner.query(`ALTER TABLE trainer_link_requests ADD COLUMN "rejectionReason" text`);
    await queryRunner.query(`ALTER TABLE trainer_link_requests ADD COLUMN "cancelledAt" timestamp`);
    await queryRunner.query(`ALTER TABLE trainer_link_requests ADD COLUMN "respondedAt" timestamp`);
    await queryRunner.query(`ALTER TABLE trainer_link_requests ADD COLUMN "respondedById" uuid`);
    await queryRunner.query(`ALTER TABLE trainer_link_requests ADD COLUMN "createdAt" timestamp`);
    await queryRunner.query(`ALTER TABLE trainer_link_requests ADD COLUMN "updatedAt" timestamp`);
    await queryRunner.query(`
      UPDATE trainer_link_requests SET
        "clientId" = client_id,
        "trainerId" = trainer_id,
        "rejectionReason" = rejection_reason,
        "cancelledAt" = cancelled_at,
        "respondedAt" = responded_at,
        "respondedById" = responded_by_id,
        "createdAt" = created_at,
        "updatedAt" = updated_at
    `);
    await queryRunner.query(`ALTER TABLE trainer_link_requests DROP COLUMN client_id`);
    await queryRunner.query(`ALTER TABLE trainer_link_requests DROP COLUMN trainer_id`);
    await queryRunner.query(`ALTER TABLE trainer_link_requests DROP COLUMN rejection_reason`);
    await queryRunner.query(`ALTER TABLE trainer_link_requests DROP COLUMN cancelled_at`);
    await queryRunner.query(`ALTER TABLE trainer_link_requests DROP COLUMN responded_at`);
    await queryRunner.query(`ALTER TABLE trainer_link_requests DROP COLUMN responded_by_id`);
    await queryRunner.query(`ALTER TABLE trainer_link_requests DROP COLUMN created_at`);
    await queryRunner.query(`ALTER TABLE trainer_link_requests DROP COLUMN updated_at`);
    await queryRunner.query(`ALTER TABLE trainer_link_requests ALTER COLUMN "clientId" SET NOT NULL`);
    await queryRunner.query(`ALTER TABLE trainer_link_requests ALTER COLUMN "trainerId" SET NOT NULL`);

    // === trainer_links (same issue) ===
    await queryRunner.query(`ALTER TABLE trainer_links ADD COLUMN "clientId" uuid`);
    await queryRunner.query(`ALTER TABLE trainer_links ADD COLUMN "trainerId" uuid`);
    await queryRunner.query(`ALTER TABLE trainer_links ADD COLUMN "linkRequestId" uuid`);
    await queryRunner.query(`ALTER TABLE trainer_links ADD COLUMN "deactivatedAt" timestamp`);
    await queryRunner.query(`ALTER TABLE trainer_links ADD COLUMN "deactivationReason" text`);
    await queryRunner.query(`ALTER TABLE trainer_links ADD COLUMN "createdAt" timestamp`);
    await queryRunner.query(`ALTER TABLE trainer_links ADD COLUMN "updatedAt" timestamp`);
    await queryRunner.query(`
      UPDATE trainer_links SET
        "clientId" = client_id,
        "trainerId" = trainer_id,
        "linkRequestId" = link_request_id,
        "deactivatedAt" = deactivated_at,
        "deactivationReason" = deactivation_reason,
        "createdAt" = created_at,
        "updatedAt" = updated_at
    `);
    await queryRunner.query(`ALTER TABLE trainer_links DROP COLUMN client_id`);
    await queryRunner.query(`ALTER TABLE trainer_links DROP COLUMN trainer_id`);
    await queryRunner.query(`ALTER TABLE trainer_links DROP COLUMN link_request_id`);
    await queryRunner.query(`ALTER TABLE trainer_links DROP COLUMN deactivated_at`);
    await queryRunner.query(`ALTER TABLE trainer_links DROP COLUMN deactivation_reason`);
    await queryRunner.query(`ALTER TABLE trainer_links DROP COLUMN created_at`);
    await queryRunner.query(`ALTER TABLE trainer_links DROP COLUMN updated_at`);
    await queryRunner.query(`ALTER TABLE trainer_links ALTER COLUMN "clientId" SET NOT NULL`);
    await queryRunner.query(`ALTER TABLE trainer_links ALTER COLUMN "trainerId" SET NOT NULL`);
    await queryRunner.query(`ALTER TABLE trainer_links ALTER COLUMN "linkRequestId" SET NOT NULL`);

    // === trainer_assigned_routines ===
    await queryRunner.query(`ALTER TABLE trainer_assigned_routines ADD COLUMN "trainerId" uuid`);
    await queryRunner.query(`ALTER TABLE trainer_assigned_routines ADD COLUMN "clientId" uuid`);
    await queryRunner.query(`ALTER TABLE trainer_assigned_routines ADD COLUMN "linkId" uuid`);
    await queryRunner.query(`ALTER TABLE trainer_assigned_routines ADD COLUMN "routineId" uuid`);
    await queryRunner.query(`ALTER TABLE trainer_assigned_routines ADD COLUMN "routineSnapshot" jsonb`);
    await queryRunner.query(`ALTER TABLE trainer_assigned_routines ADD COLUMN "replacedById" uuid`);
    await queryRunner.query(`ALTER TABLE trainer_assigned_routines ADD COLUMN "assignedAt" timestamp`);
    await queryRunner.query(`ALTER TABLE trainer_assigned_routines ADD COLUMN "createdAt" timestamp`);
    await queryRunner.query(`ALTER TABLE trainer_assigned_routines ADD COLUMN "updatedAt" timestamp`);
    await queryRunner.query(`
      UPDATE trainer_assigned_routines SET
        "trainerId" = trainer_id,
        "clientId" = client_id,
        "linkId" = link_id,
        "routineId" = routine_id,
        "routineSnapshot" = routine_snapshot,
        "replacedById" = replaced_by_id,
        "assignedAt" = assigned_at,
        "createdAt" = created_at,
        "updatedAt" = updated_at
    `);
    await queryRunner.query(`ALTER TABLE trainer_assigned_routines DROP COLUMN trainer_id`);
    await queryRunner.query(`ALTER TABLE trainer_assigned_routines DROP COLUMN client_id`);
    await queryRunner.query(`ALTER TABLE trainer_assigned_routines DROP COLUMN link_id`);
    await queryRunner.query(`ALTER TABLE trainer_assigned_routines DROP COLUMN routine_id`);
    await queryRunner.query(`ALTER TABLE trainer_assigned_routines DROP COLUMN routine_snapshot`);
    await queryRunner.query(`ALTER TABLE trainer_assigned_routines DROP COLUMN replaced_by_id`);
    await queryRunner.query(`ALTER TABLE trainer_assigned_routines DROP COLUMN assigned_at`);
    await queryRunner.query(`ALTER TABLE trainer_assigned_routines DROP COLUMN created_at`);
    await queryRunner.query(`ALTER TABLE trainer_assigned_routines DROP COLUMN updated_at`);
    await queryRunner.query(`ALTER TABLE trainer_assigned_routines ALTER COLUMN "trainerId" SET NOT NULL`);
    await queryRunner.query(`ALTER TABLE trainer_assigned_routines ALTER COLUMN "clientId" SET NOT NULL`);
    await queryRunner.query(`ALTER TABLE trainer_assigned_routines ALTER COLUMN "linkId" SET NOT NULL`);
    await queryRunner.query(`ALTER TABLE trainer_assigned_routines ALTER COLUMN "routineId" SET NOT NULL`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Simplified reverse
  }
}
