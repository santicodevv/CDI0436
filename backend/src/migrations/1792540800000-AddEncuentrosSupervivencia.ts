import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddEncuentrosSupervivencia1792540800000 implements MigrationInterface {
  name = 'AddEncuentrosSupervivencia1792540800000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "encuentros_supervivencia" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "supervivencia_id" uuid NOT NULL,
        "fecha" date NOT NULL,
        CONSTRAINT "PK_encuentros_supervivencia" PRIMARY KEY ("id"),
        CONSTRAINT "FK_encuentros_supervivencia_curso" FOREIGN KEY ("supervivencia_id")
          REFERENCES "supervivencias"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX "IDX_ENCUENTROS_SUPERV_CURSO_FECHA"
      ON "encuentros_supervivencia" ("supervivencia_id", "fecha")
    `);
    // Mantener accesibles los encuentros que ya tienen asistencia o fotos.
    await queryRunner.query(`
      INSERT INTO "encuentros_supervivencia" ("supervivencia_id", "fecha")
      SELECT "supervivencia_id", "fecha" FROM "asistencias_supervivencia" WHERE "supervivencia_id" IS NOT NULL
      UNION
      SELECT "supervivencia_id", "fecha" FROM "fotos_asistencia_supervivencia" WHERE "supervivencia_id" IS NOT NULL
      ON CONFLICT ("supervivencia_id", "fecha") DO NOTHING
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE "encuentros_supervivencia"');
  }
}
