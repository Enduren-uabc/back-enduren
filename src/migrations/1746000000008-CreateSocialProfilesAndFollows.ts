import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
  TableIndex,
  TableUnique,
} from 'typeorm';

export class CreateSocialProfilesAndFollows1746000000008 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'social_profiles',
        columns: [
          { name: 'userId', type: 'uuid', isPrimary: true },
          {
            name: 'displayName',
            type: 'varchar',
            length: '120',
            isNullable: false,
          },
          { name: 'handle', type: 'varchar', length: '60', isNullable: false },
          { name: 'bio', type: 'varchar', length: '300', isNullable: true },
          { name: 'createdAt', type: 'timestamp', default: 'now()' },
          { name: 'updatedAt', type: 'timestamp', default: 'now()' },
        ],
      }),
      true,
    );

    await queryRunner.createIndex(
      'social_profiles',
      new TableIndex({
        name: 'IDX_social_profiles_displayName',
        columnNames: ['displayName'],
      }),
    );

    await queryRunner.createIndex(
      'social_profiles',
      new TableIndex({
        name: 'IDX_social_profiles_handle',
        columnNames: ['handle'],
        isUnique: true,
      }),
    );

    await queryRunner.createTable(
      new Table({
        name: 'profile_follows',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true },
          { name: 'followerUserId', type: 'uuid', isNullable: false },
          { name: 'followedUserId', type: 'uuid', isNullable: false },
          { name: 'createdAt', type: 'timestamp', default: 'now()' },
        ],
      }),
      true,
    );

    await queryRunner.createForeignKey(
      'profile_follows',
      new TableForeignKey({
        columnNames: ['followerUserId'],
        referencedColumnNames: ['userId'],
        referencedTableName: 'social_profiles',
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'profile_follows',
      new TableForeignKey({
        columnNames: ['followedUserId'],
        referencedColumnNames: ['userId'],
        referencedTableName: 'social_profiles',
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createUniqueConstraint(
      'profile_follows',
      new TableUnique({
        name: 'UQ_profile_follows_follower_followed',
        columnNames: ['followerUserId', 'followedUserId'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('profile_follows');
    await queryRunner.dropTable('social_profiles');
  }
}
