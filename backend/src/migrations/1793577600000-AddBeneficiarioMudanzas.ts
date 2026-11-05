import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddBeneficiarioMudanzas1793577600000 implements MigrationInterface {
  name = 'AddBeneficiarioMudanzas1793577600000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "public"."beneficiario_mudanzas" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "beneficiario_id" uuid NOT NULL REFERENCES "public"."beneficiarios"("id") ON DELETE CASCADE,
        "direccion" text NOT NULL,
        "telefono" varchar(20) NOT NULL,
        "cuidador" varchar(100) NOT NULL,
        "resultado" varchar(10) CONSTRAINT "CHK_MUDANZAS_RESULTADO" CHECK ("resultado" IN ('traslado', 'salida')),
        "centro_receptor" varchar(150),
        "registrado_por_id" uuid NOT NULL,
        "registrado_por" text NOT NULL,
        "registrado_en" timestamptz NOT NULL DEFAULT now(),
        "finalizado_por_id" uuid,
        "finalizado_por" text,
        "finalizado_en" timestamptz
      )
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_MUDANZAS_BENEFICIARIO_FECHA"
      ON "public"."beneficiario_mudanzas" ("beneficiario_id", "registrado_en")
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX "IDX_MUDANZA_PENDIENTE"
      ON "public"."beneficiario_mudanzas" ("beneficiario_id") WHERE "resultado" IS NULL
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE "public"."beneficiario_mudanzas"');
  }
}
