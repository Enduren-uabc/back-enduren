import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddCurrentExerciseIndex1746000000004 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'workout_sessions',
      new TableColumn({
        name: 'currentExerciseIndex',
        type: 'int',
        default: 0,
        isNullable: false,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('workout_sessions', 'currentExerciseIndex');
  }
}
