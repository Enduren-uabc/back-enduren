import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddSocialMediaFields1746000000009 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'publications',
      new TableColumn({
        name: 'mediaUrls',
        type: 'text',
        isArray: true,
        isNullable: false,
        default: "'{}'",
      }),
    );

    await queryRunner.addColumn(
      'social_profiles',
      new TableColumn({
        name: 'avatarUrl',
        type: 'varchar',
        length: '2048',
        isNullable: true,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('social_profiles', 'avatarUrl');
    await queryRunner.dropColumn('publications', 'mediaUrls');
  }
}
