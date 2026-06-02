import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * NO-OP: la columna ya está como trainer_code en snake_case y la entidad
 * UserTypeormEntity ya tiene { name: 'trainer_code' } en @Column.
 */
export class AddTrainerCodeCamelCase1763000000003 implements MigrationInterface {
  public async up(_queryRunner: QueryRunner): Promise<void> {
    // No-op — la BD debe permanecer en snake_case
  }

  public async down(_queryRunner: QueryRunner): Promise<void> {
    // No-op
  }
}
