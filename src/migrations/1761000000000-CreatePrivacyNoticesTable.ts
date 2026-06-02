import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreatePrivacyNoticesTable1761000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS privacy_notices (
        id uuid PRIMARY KEY,
        version varchar(20) NOT NULL,
        content text NOT NULL,
        "updatedAt" timestamp NOT NULL,
        "isActive" boolean NOT NULL DEFAULT true,
        "contentHash" varchar(64),
        "createdAt" timestamp NOT NULL DEFAULT now()
      )
    `);

    await queryRunner.query(`DELETE FROM privacy_notices`);

    await queryRunner.query(`
      INSERT INTO privacy_notices (id, version, content, "updatedAt")
      VALUES (
        gen_random_uuid(),
        '1.0',
        $privacy$AVISO DE PRIVACIDAD DE ENDURE

Fecha de última actualización: 15 de mayo de 2026
Versión: 1.0

1. IDENTIDAD Y DOMICILIO DEL RESPONSABLE

BienaTech (en adelante "Endure"), con domicilio en la Ciudad de México, es el responsable del tratamiento de sus datos personales.

2. DATOS PERSONALES QUE RECABAMOS

Para las finalidades señaladas en el presente aviso de privacidad, podemos recabar y tratar los siguientes datos personales:

- Datos de identificación: nombre de usuario, correo electrónico.
- Datos de salud: peso, estatura, nivel de condición física, objetivos de entrenamiento.
- Datos de uso: historial de entrenamientos, rutinas realizadas, rendimiento deportivo.

3. FINALIDADES DEL TRATAMIENTO

Sus datos personales serán utilizados para las siguientes finalidades:

a) Finalidades necesarias:
   - Crear y administrar su cuenta de usuario.
   - Proporcionar los servicios de entrenamiento personalizado.
   - Registrar y dar seguimiento a su progreso físico.
   - Generar rutinas y planes de entrenamiento.

b) Finalidades adicionales:
   - Enviar recordatorios de entrenamiento.
   - Mejorar nuestros servicios mediante análisis de uso.

4. TRANSFERENCIA DE DATOS

No se realizarán transferencias de sus datos personales a terceros sin su consentimiento, salvo las excepciones previstas en la legislación aplicable.

5. DERECHOS ARCO

Usted tiene derecho a:
- Acceder a sus datos personales.
- Rectificar sus datos si son inexactos.
- Cancelar el tratamiento de sus datos.
- Oponerse al tratamiento de sus datos.

Para ejercer estos derechos, envíe su solicitud a: privacidad@endure.app

6. CAMBIOS AL AVISO DE PRIVACIDAD

Endure se reserva el derecho de modificar el presente aviso de privacidad en cualquier momento. Los cambios entrarán en vigor a partir de su publicación en la aplicación.

7. CONSENTIMIENTO

Al utilizar la aplicación Endure, usted otorga su consentimiento para el tratamiento de sus datos personales conforme al presente aviso de privacidad.$privacy$,
        '2026-05-15T00:00:00.000Z'
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS privacy_notices`);
  }
}
