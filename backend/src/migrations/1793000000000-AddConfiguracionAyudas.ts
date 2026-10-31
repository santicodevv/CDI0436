import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddConfiguracionAyudas1793000000000 implements MigrationInterface {
  name = 'AddConfiguracionAyudas1793000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "public"."configuracion_ayudas" (
        "id" integer NOT NULL,
        "habilitada" boolean NOT NULL DEFAULT true,
        "motivo" text,
        "actualizado_por" character varying(255),
        "actualizado_en" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_configuracion_ayudas" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`
      INSERT INTO "public"."configuracion_ayudas" ("id", "habilitada")
      VALUES (1, true)
      ON CONFLICT ("id") DO NOTHING
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE "public"."configuracion_ayudas"');
  }
}
