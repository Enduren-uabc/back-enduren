import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class MigrateExerciseConfigToSets1746000000012 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Migrate existing data: for each exercise with sets, repsPerSet, weight,
    // generate N rows in exercise_sets (N = sets), all with same reps and weight.
    const exercises = await queryRunner.query(
      `SELECT id, sets, repsPerSet, weight FROM exercises WHERE sets IS NOT NULL AND repsPerSet IS NOT NULL AND weight IS NOT NULL`,
    );

    for (const exercise of exercises) {
      const count = exercise.sets;
      for (let i = 1; i <= count; i++) {
        const setId = crypto.randomUUID();
        await queryRunner.query(
          `INSERT INTO exercise_sets (id, "exerciseId", "setNumber", reps, weight, "restSeconds") VALUES ($1, $2, $3, $4, $5, $6)`,
          [setId, exercise.id, i, exercise.repsPerSet, exercise.weight, null],
        );
      }
    }

    // Drop old columns from exercises
    await queryRunner.dropColumn('exercises', 'sets');
    await queryRunner.dropColumn('exercises', 'repsPerSet');
    await queryRunner.dropColumn('exercises', 'weight');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Re-add old columns
    await queryRunner.addColumn(
      'exercises',
      new TableColumn({
        name: 'sets',
        type: 'int',
        isNullable: true,
      }),
    );

    await queryRunner.addColumn(
      'exercises',
      new TableColumn({
        name: 'repsPerSet',
        type: 'int',
        isNullable: true,
      }),
    );

    await queryRunner.addColumn(
      'exercises',
      new TableColumn({
        name: 'weight',
        type: 'float',
        isNullable: true,
      }),
    );

    // We cannot reliably restore the old flat config from detailed sets,
    // so we leave the columns nullable/empty in a rollback scenario.
    await queryRunner.query(`DELETE FROM exercise_sets`);
  }
}
