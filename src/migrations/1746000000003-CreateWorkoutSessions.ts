import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
} from 'typeorm';

export class CreateWorkoutSessions1746000000003 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'workout_sessions',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
          },
          {
            name: 'userId',
            type: 'uuid',
          },
          {
            name: 'routineId',
            type: 'uuid',
          },
          {
            name: 'status',
            type: 'varchar',
          },
          {
            name: 'startedAt',
            type: 'timestamptz',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'finishedAt',
            type: 'timestamptz',
            isNullable: true,
          },
        ],
      }),
      true,
    );

    await queryRunner.createTable(
      new Table({
        name: 'workout_session_exercises',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
          },
          {
            name: 'sessionId',
            type: 'uuid',
          },
          {
            name: 'exerciseId',
            type: 'uuid',
          },
          {
            name: 'exerciseName',
            type: 'varchar',
          },
          {
            name: 'orderIndex',
            type: 'int',
          },
          {
            name: 'sets',
            type: 'int',
          },
          {
            name: 'repsPerSet',
            type: 'int',
          },
          {
            name: 'weight',
            type: 'float',
          },
        ],
      }),
      true,
    );

    await queryRunner.createTable(
      new Table({
        name: 'workout_session_sets',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
          },
          {
            name: 'sessionExerciseId',
            type: 'uuid',
          },
          {
            name: 'setNumber',
            type: 'int',
          },
          {
            name: 'repsPerformed',
            type: 'int',
            isNullable: true,
          },
          {
            name: 'weightUsed',
            type: 'float',
            isNullable: true,
          },
          {
            name: 'completed',
            type: 'boolean',
            default: false,
          },
        ],
      }),
      true,
    );

    await queryRunner.createForeignKey(
      'workout_session_exercises',
      new TableForeignKey({
        columnNames: ['sessionId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'workout_sessions',
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'workout_session_sets',
      new TableForeignKey({
        columnNames: ['sessionExerciseId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'workout_session_exercises',
        onDelete: 'CASCADE',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('workout_session_sets');
    await queryRunner.dropTable('workout_session_exercises');
    await queryRunner.dropTable('workout_sessions');
  }
}
