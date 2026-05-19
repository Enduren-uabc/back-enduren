import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
  TableIndex,
} from 'typeorm';

export class CreateUserProfilesTable1746000000008 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'user_profiles',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
          },
          {
            name: 'userId',
            type: 'uuid',
            isUnique: true,
          },
          {
            name: 'fullName',
            type: 'varchar',
          },
          {
            name: 'birthDate',
            type: 'date',
          },
          {
            name: 'gender',
            type: 'varchar',
          },
          {
            name: 'weight',
            type: 'numeric',
            precision: 5,
            scale: 2,
          },
          {
            name: 'height',
            type: 'numeric',
            precision: 5,
            scale: 2,
          },
          {
            name: 'experienceLevel',
            type: 'varchar',
          },
          {
            name: 'mainGoal',
            type: 'varchar',
          },
          {
            name: 'daysAvailablePerWeek',
            type: 'integer',
            default: 3,
          },
          {
            name: 'weightUnit',
            type: 'varchar',
            default: "'kg'",
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'now()',
          },
          {
            name: 'updatedAt',
            type: 'timestamp',
            default: 'now()',
          },
        ],
      }),
      true,
    );

    await queryRunner.createForeignKey(
      'user_profiles',
      new TableForeignKey({
        columnNames: ['userId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'CASCADE',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('user_profiles');
  }
}
