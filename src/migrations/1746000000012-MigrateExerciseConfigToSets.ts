import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class MigrateExerciseConfigToSets1746000000012 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const exercisesTable = await queryRunner.getTable('exercises');
    const oldColumns = ['sets', 'repsPerSet', 'weight'];
    const existingOldColumns = oldColumns.filter((column) =>
      exercisesTable?.findColumnByName(column),
    );

    // Migrate existing data: for each exercise with sets, repsPerSet, weight,
    // generate N rows in exercise_sets (N = sets), all with same reps and weight.
    if (existingOldColumns.length === oldColumns.length) {
      const exercises = await queryRunner.query(
        `SELECT id, sets, "repsPerSet" AS "repsPerSet", weight
         FROM exercises e
         WHERE sets IS NOT NULL
           AND "repsPerSet" IS NOT NULL
           AND weight IS NOT NULL
           AND NOT EXISTS (
             SELECT 1 FROM exercise_sets es WHERE es."exerciseId" = e.id
           )`,
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
    }

    // Drop old columns from exercises
    for (const column of existingOldColumns.reverse()) {
      await queryRunner.dropColumn('exercises', column);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const exercisesTable = await queryRunner.getTable('exercises');

    // Re-add old columns
    if (!exercisesTable?.findColumnByName('sets')) {
      await queryRunner.addColumn(
        'exercises',
        new TableColumn({
          name: 'sets',
          type: 'int',
          isNullable: true,
        }),
      );
    }

    if (!exercisesTable?.findColumnByName('repsPerSet')) {
      await queryRunner.addColumn(
        'exercises',
        new TableColumn({
          name: 'repsPerSet',
          type: 'int',
          isNullable: true,
        }),
      );
    }

    if (!exercisesTable?.findColumnByName('weight')) {
      await queryRunner.addColumn(
        'exercises',
        new TableColumn({
          name: 'weight',
          type: 'float',
          isNullable: true,
        }),
      );
    }

    // We cannot reliably restore the old flat config from detailed sets,
    // so we leave the columns nullable/empty in a rollback scenario.
    await queryRunner.query(`DELETE FROM exercise_sets`);
  }
}
