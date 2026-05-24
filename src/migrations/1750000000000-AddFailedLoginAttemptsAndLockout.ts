import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddFailedLoginAttemptsAndLockout1750000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumns('users', [
      new TableColumn({
        name: 'failed_login_attempts',
        type: 'int',
        default: 0,
      }),
      new TableColumn({
        name: 'locked_until',
        type: 'timestamp',
        isNullable: true,
      }),
    ]);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumns('users', [
      'failed_login_attempts',
      'locked_until',
    ]);
  }
}
