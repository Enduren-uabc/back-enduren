import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
  TableIndex,
} from 'typeorm';

export class CreateScoringResultsTable1746000000026 implements MigrationInterface {
  name = 'CreateScoringResultsTable1746000000026';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'scoring_results',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true },
          { name: 'verification_id', type: 'uuid' },
          { name: 'risk_score', type: 'integer' },
          { name: 'risk_level', type: 'varchar', length: '20' },
          { name: 'recommended_action', type: 'varchar', length: '30' },
          { name: 'summary', type: 'text' },
          { name: 'positive_signals', type: 'json' },
          { name: 'alerts', type: 'json' },
          { name: 'overrides', type: 'json' },
          { name: 'created_at', type: 'timestamp', default: 'now()' },
        ],
      }),
      true,
    );

    await queryRunner.createForeignKey(
      'scoring_results',
      new TableForeignKey({
        columnNames: ['verification_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'trainer_verifications',
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createIndex(
      'scoring_results',
      new TableIndex({
        name: 'IDX_scoring_results_verification',
        columnNames: ['verification_id'],
      }),
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('scoring_results');
  }
}
