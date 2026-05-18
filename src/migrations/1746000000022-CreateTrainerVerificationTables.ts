import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateTrainerVerificationTables1746000000022 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto"`);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS specialty_catalog (
        key VARCHAR(50) PRIMARY KEY,
        display_name VARCHAR(100) NOT NULL,
        category VARCHAR(50) NOT NULL,
        icon_url VARCHAR(500),
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS trainer_verifications (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        verification_status VARCHAR(20) DEFAULT 'pending' NOT NULL,
        years_of_experience INT NOT NULL,
        short_bio TEXT NOT NULL,
        id_document_number VARCHAR(100) NOT NULL,
        rejection_reason TEXT,
        verified_by UUID REFERENCES users(id),
        verified_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
        CONSTRAINT chk_trainer_verification_status
          CHECK (verification_status IN ('pending', 'approved', 'rejected')),
        CONSTRAINT chk_trainer_years_of_experience
          CHECK (years_of_experience >= 0 AND years_of_experience <= 50),
        CONSTRAINT chk_trainer_short_bio_length
          CHECK (LENGTH(short_bio) <= 500),
        CONSTRAINT unq_user_trainer_verification UNIQUE (user_id)
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS trainer_verification_specialties (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        trainer_verification_id UUID NOT NULL
          REFERENCES trainer_verifications(id) ON DELETE CASCADE,
        specialty_key VARCHAR(50) NOT NULL
          REFERENCES specialty_catalog(key),
        CONSTRAINT unq_verification_specialty
          UNIQUE (trainer_verification_id, specialty_key)
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS trainer_id_documents (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        trainer_verification_id UUID NOT NULL
          REFERENCES trainer_verifications(id) ON DELETE CASCADE,
        document_type VARCHAR(20) NOT NULL,
        file_url TEXT NOT NULL,
        file_name VARCHAR(255) NOT NULL,
        file_size INT NOT NULL,
        uploaded_at TIMESTAMP DEFAULT NOW() NOT NULL,
        CONSTRAINT chk_trainer_document_type
          CHECK (document_type IN ('ine_front', 'ine_back', 'passport', 'other'))
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS trainer_certificates (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        trainer_verification_id UUID NOT NULL
          REFERENCES trainer_verifications(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        issuing_organization VARCHAR(255) NOT NULL,
        document_url TEXT NOT NULL,
        file_name VARCHAR(255) NOT NULL,
        file_size INT NOT NULL,
        uploaded_at TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `);

    await queryRunner.query(`
      INSERT INTO specialty_catalog (key, display_name, category) VALUES
        ('strength', 'Fuerza', 'resistance'),
        ('hypertrophy', 'Hipertrofia', 'resistance'),
        ('weight_loss', 'Perdida de peso', 'conditioning'),
        ('endurance', 'Resistencia cardiovascular', 'conditioning'),
        ('rehabilitation', 'Rehabilitacion', 'clinical'),
        ('flexibility', 'Flexibilidad', 'mobility'),
        ('functional', 'Entrenamiento funcional', 'resistance'),
        ('sports', 'Entrenamiento deportivo', 'performance'),
        ('yoga', 'Yoga', 'mind_body'),
        ('pilates', 'Pilates', 'mind_body'),
        ('crossfit', 'CrossFit', 'conditioning'),
        ('general_fitness', 'Acondicionamiento general', 'conditioning')
      ON CONFLICT (key) DO UPDATE SET
        display_name = EXCLUDED.display_name,
        category = EXCLUDED.category
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS trainer_certificates`);
    await queryRunner.query(`DROP TABLE IF EXISTS trainer_id_documents`);
    await queryRunner.query(
      `DROP TABLE IF EXISTS trainer_verification_specialties`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS trainer_verifications`);
    await queryRunner.query(`DROP TABLE IF EXISTS specialty_catalog`);
  }
}
