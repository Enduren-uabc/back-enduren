import { createHash } from 'crypto';
import { MigrationInterface, QueryRunner } from 'typeorm';

export class HashRefreshTokens1791330000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const tokens: { id: string; token: string }[] = await queryRunner.query(
      'SELECT id, token FROM refresh_tokens',
    );
    for (const item of tokens) {
      if (/^[a-f0-9]{64}$/.test(item.token)) continue;
      const hash = createHash('sha256').update(item.token).digest('hex');
      await queryRunner.query('UPDATE refresh_tokens SET token = $1 WHERE id = $2', [
        hash, item.id,
      ]);
    }
  }

  public async down(): Promise<void> {
    // A hash cannot be restored to its original credential.
  }
}
