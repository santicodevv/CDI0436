import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddDesembolsos1793100000000 implements MigrationInterface {
  name = 'AddDesembolsos1793100000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "public"."desembolsos" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "fecha" date NOT NULL,
        "detalle" text NOT NULL,
        "codigo_beneficiario" character varying(20) NOT NULL,
        "nombre_beneficiario" character varying(200) NOT NULL,
        "referencia" character varying(100),
        "cuenta" character varying(100),
        "monto" numeric(12,2) NOT NULL,
        "beneficiario_id" uuid,
        "registrado_por_id" uuid,
        "creado_en" TIMESTAMP NOT NULL DEFAULT now(),
        "actualizado_en" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_desembolsos" PRIMARY KEY ("id"),
        CONSTRAINT "FK_desembolsos_beneficiario" FOREIGN KEY ("beneficiario_id")
          REFERENCES "public"."beneficiarios"("id") ON DELETE SET NULL,
        CONSTRAINT "FK_desembolsos_registrado_por" FOREIGN KEY ("registrado_por_id")
          REFERENCES "public"."usuarios"("id") ON DELETE SET NULL
      )
    `);
    await queryRunner.query(
      'CREATE INDEX "IDX_DESEMBOLSOS_BENEFICIARIO" ON "public"."desembolsos" ("beneficiario_id")',
    );
    await queryRunner.query(
      'CREATE INDEX "IDX_DESEMBOLSOS_FECHA" ON "public"."desembolsos" ("fecha")',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE "public"."desembolsos"');
  }
}
