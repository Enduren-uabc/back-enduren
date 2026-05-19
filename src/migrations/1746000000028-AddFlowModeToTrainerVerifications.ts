import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddFlowModeToTrainerVerifications1746000000028 implements MigrationInterface {
  name = 'AddFlowModeToTrainerVerifications1746000000028';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'trainer_verifications',
      new TableColumn({
        name: 'flow_mode',
        type: 'varchar',
        length: '20',
        default: "'legacy'",
        isNullable: false,
      }),
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('trainer_verifications', 'flow_mode');
  }
}
