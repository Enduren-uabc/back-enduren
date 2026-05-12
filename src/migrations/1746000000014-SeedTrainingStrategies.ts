import { MigrationInterface, QueryRunner } from 'typeorm';

export class SeedTrainingStrategies1746000000014 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      INSERT INTO training_strategies (key, name, description, rules)
      VALUES
        ('straight', 'Straight (Estática)', 'Peso y reps constantes en todos los sets.', '{"type":"linear","weightStep":0,"repStep":0}'),
        ('ascending', 'Ascending / UPP (Pirámide Ascendente)', 'Sube peso, bajan reps en cada set.', '{"type":"linear","weightStep":2.5,"repStep":-2}'),
        ('descending', 'Descending / Down (Pirámide Descendente)', 'Empieza peso máximo, baja peso, suben reps.', '{"type":"linear","weightStep":-2.5,"repStep":2}'),
        ('drop_sets', 'Drop Sets (Sobrecarga)', 'Sin descanso, baja peso rápido, mismas reps.', '{"type":"percentage","weightPercentage":0.8,"repStep":0}'),
        ('wave_loading', 'Wave Loading (Ondulante)', 'Alterna pesos en olas sobre peso base, reps fijas.', '{"type":"wave","wavePercentages":[0,0.05,0.025,0.075]}')
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DELETE FROM training_strategies WHERE key IN ('straight', 'ascending', 'descending', 'drop_sets', 'wave_loading')`,
    );
  }
}
