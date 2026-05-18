import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddDayOfWeekToWorkoutSessions1746000000020 implements MigrationInterface {
  name = 'AddDayOfWeekToWorkoutSessions1746000000020';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'workout_sessions',
      new TableColumn({
        name: 'dayOfWeek',
        type: 'varchar',
        default: "'monday'",
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('workout_sessions', 'dayOfWeek');
  }
}
