import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddAssignedReviewer1746000000027 implements MigrationInterface {
  name = 'AddAssignedReviewer1746000000027';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'trainer_verifications',
      new TableColumn({
        name: 'assigned_reviewer_id',
        type: 'uuid',
        isNullable: true,
      }),
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn(
      'trainer_verifications',
      'assigned_reviewer_id',
    );
  }
}
