import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddEncuentrosClub1792800000000 implements MigrationInterface {
  name = 'AddEncuentrosClub1792800000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "public"."encuentros_club" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "club_id" uuid NOT NULL,
        "fecha" date NOT NULL,
        CONSTRAINT "PK_encuentros_club" PRIMARY KEY ("id"),
        CONSTRAINT "FK_encuentros_club_curso" FOREIGN KEY ("club_id")
          REFERENCES "public"."clubes"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX "IDX_ENCUENTROS_CLUB_CURSO_FECHA"
      ON "public"."encuentros_club" ("club_id", "fecha")
    `);
    // Mantener accesibles los encuentros que ya tienen asistencia o fotos.
    await queryRunner.query(`
      INSERT INTO "public"."encuentros_club" ("club_id", "fecha")
      SELECT "club_id", "fecha" FROM "public"."asistencias_club" WHERE "club_id" IS NOT NULL
      UNION
      SELECT "club_id", "fecha" FROM "public"."fotos_asistencia_club" WHERE "club_id" IS NOT NULL
      ON CONFLICT ("club_id", "fecha") DO NOTHING
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE "public"."encuentros_club"');
  }
}
