import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTickets1793200000000 implements MigrationInterface {
  name = 'AddTickets1793200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "public"."tickets" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "numero" SERIAL NOT NULL,
        "titulo" character varying(200) NOT NULL,
        "descripcion" text NOT NULL,
        "tipo" character varying(20) NOT NULL DEFAULT 'mejora',
        "prioridad" character varying(20) NOT NULL DEFAULT 'media',
        "estado" character varying(20) NOT NULL DEFAULT 'abierto',
        "respuesta" text,
        "documento_path" character varying(500),
        "documento_nombre" character varying(255),
        "creado_por_id" uuid,
        "cerrado_en" TIMESTAMP,
        "creado_en" TIMESTAMP NOT NULL DEFAULT now(),
        "actualizado_en" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_tickets" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_tickets_numero" UNIQUE ("numero"),
        CONSTRAINT "FK_tickets_creado_por" FOREIGN KEY ("creado_por_id")
          REFERENCES "public"."usuarios"("id") ON DELETE SET NULL
      )
    `);
    await queryRunner.query(
      'CREATE INDEX "IDX_TICKETS_ESTADO" ON "public"."tickets" ("estado")',
    );
    await queryRunner.query(
      'CREATE INDEX "IDX_TICKETS_CREADO_POR" ON "public"."tickets" ("creado_por_id")',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE "public"."tickets"');
  }
}
