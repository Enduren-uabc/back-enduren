import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class CreateTrainingRemindersAndPushTables1760000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'training_reminders',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true },
          { name: 'userId', type: 'uuid' },
          { name: 'routineId', type: 'uuid' },
          { name: 'routineName', type: 'varchar' },
          { name: 'dayOfWeek', type: 'varchar' },
          { name: 'time', type: 'varchar', length: '5' },
          { name: 'timezone', type: 'varchar', length: '50', default: "'America/Mexico_City'" },
          { name: 'status', type: 'varchar', length: '20', default: "'activo'" },
          { name: 'nextActivationAt', type: 'timestamp', isNullable: true },
          { name: 'createdAt', type: 'timestamp', default: 'now()' },
          { name: 'updatedAt', type: 'timestamp', default: 'now()' },
          { name: 'deletedAt', type: 'timestamp', isNullable: true },
        ],
        indices: [
          { columnNames: ['userId'] },
          { columnNames: ['status', 'nextActivationAt'] },
        ],
      }),
    );

    await queryRunner.createTable(
      new Table({
        name: 'push_tokens',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true },
          { name: 'userId', type: 'uuid' },
          { name: 'token', type: 'varchar' },
          { name: 'platform', type: 'varchar', length: '10' },
          { name: 'createdAt', type: 'timestamp', default: 'now()' },
          { name: 'updatedAt', type: 'timestamp', default: 'now()' },
        ],
        indices: [
          { columnNames: ['userId'] },
          { columnNames: ['token'], isUnique: true },
        ],
      }),
    );

    await queryRunner.createTable(
      new Table({
        name: 'notifications',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true },
          { name: 'userId', type: 'uuid' },
          { name: 'title', type: 'varchar' },
          { name: 'body', type: 'varchar' },
          { name: 'type', type: 'varchar', length: '20', default: "'reminder'" },
          { name: 'readAt', type: 'timestamp', isNullable: true },
          { name: 'createdAt', type: 'timestamp', default: 'now()' },
        ],
        indices: [
          { columnNames: ['userId'] },
          { columnNames: ['userId', 'readAt'] },
        ],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('notifications');
    await queryRunner.dropTable('push_tokens');
    await queryRunner.dropTable('training_reminders');
  }
}
