import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * NO-OP: las columnas ya están en snake_case en la BD y las entidades
 * TypeORM ya tienen { name: 'snake_case' } en cada @Column.
 * Esta migración habría roto el mapeo al renombrar a camelCase.
 */
export class AlignTrainerVerificationsToCamelCase1763000000000 implements MigrationInterface {
  public async up(_queryRunner: QueryRunner): Promise<void> {
    // No-op — la BD debe permanecer en snake_case
  }

  public async down(_queryRunner: QueryRunner): Promise<void> {
    // No-op
  }
}
