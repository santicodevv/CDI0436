import { MigrationInterface, QueryRunner } from 'typeorm';

export class SyncProductionDB1784300127611 implements MigrationInterface {
  name = 'SyncProductionDB1784300127611';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "asistencias" DROP CONSTRAINT IF EXISTS "FK_asistencias_registrado_por"`,
    );
    await queryRunner.query(
      `ALTER TABLE "asistencias" DROP CONSTRAINT IF EXISTS "FK_asistencias_clase"`,
    );
    await queryRunner.query(
      `ALTER TABLE "asistencias" DROP CONSTRAINT IF EXISTS "FK_asistencias_beneficiario"`,
    );
    await queryRunner.query(
      `ALTER TABLE "clases" DROP CONSTRAINT IF EXISTS "FK_clases_tutor"`,
    );
    await queryRunner.query(
      `ALTER TABLE "tutores" DROP CONSTRAINT IF EXISTS "FK_tutores_usuario"`,
    );
    await queryRunner.query(
      `ALTER TABLE "fotos_asistencia" DROP CONSTRAINT IF EXISTS "FK_fotos_asist_clase"`,
    );
    await queryRunner.query(
      `ALTER TABLE "reportes" DROP CONSTRAINT IF EXISTS "FK_reportes_generado_por"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."IDX_255b2419764a1c1b33bd2d3ce8"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."IDX_6d752ba2923c0929b12d51f524"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."IDX_cae84e9cd95d20272333e3b53f"`,
    );
    await queryRunner.query(
      `CREATE TABLE "asistencias_club" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "fecha" date NOT NULL, "presente" boolean NOT NULL DEFAULT false, "observaciones" text, "creado_en" TIMESTAMP NOT NULL DEFAULT now(), "actualizado_en" TIMESTAMP NOT NULL DEFAULT now(), "club_id" uuid NOT NULL, "beneficiario_id" uuid NOT NULL, CONSTRAINT "PK_e33348cae231c2fb0c5d916c95e" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_ASIS_CLUB_COMPOSITE" ON "asistencias_club" ("club_id", "fecha") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_ASIS_CLUB_FECHA" ON "asistencias_club" ("fecha") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_ASIS_CLUB_BENEFICIARIO_ID" ON "asistencias_club" ("beneficiario_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_ASIS_CLUB_CLUB_ID" ON "asistencias_club" ("club_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "clubes" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "nombre" character varying(100) NOT NULL, "descripcion" text, "codigo" character varying(50), "capacidad_maxima" integer NOT NULL DEFAULT '0', "activo" boolean NOT NULL DEFAULT true, "creado_en" TIMESTAMP NOT NULL DEFAULT now(), "actualizado_en" TIMESTAMP NOT NULL DEFAULT now(), "tutor_id" uuid, CONSTRAINT "PK_fb4807a2b8fe43f7bd7b80cf146" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_CLUBES_ACTIVO" ON "clubes" ("activo") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_CLUBES_CODIGO" ON "clubes" ("codigo") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_CLUBES_TUTOR_ID" ON "clubes" ("tutor_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "fotos_asistencia_club" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "fecha" date NOT NULL, "imagen_url" text NOT NULL, "nombre_original" character varying(255), "creado_en" TIMESTAMP NOT NULL DEFAULT now(), "actualizado_en" TIMESTAMP NOT NULL DEFAULT now(), "club_id" uuid, CONSTRAINT "PK_88e3253a7d3b25a779f2eac0a35" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_FOTOS_CLUB_FECHA" ON "fotos_asistencia_club" ("fecha") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_FOTOS_CLUB_CLUB_ID" ON "fotos_asistencia_club" ("club_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_FOTOS_CLUB_COMPOSITE" ON "fotos_asistencia_club" ("club_id", "fecha") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."documentos_usuario_tipo_documento_enum" AS ENUM('firma', 'antecedentes_penales', 'examen_proteccion', 'vacaciones', 'licencias', 'suspension', 'amonestacion', 'otro')`,
    );
    await queryRunner.query(
      `CREATE TABLE "documentos_usuario" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "tipo_documento" "public"."documentos_usuario_tipo_documento_enum" NOT NULL, "año" integer NOT NULL, "archivo_url" text NOT NULL, "nombre_original" character varying(255) NOT NULL, "notas" text, "creado_en" TIMESTAMP NOT NULL DEFAULT now(), "actualizado_en" TIMESTAMP NOT NULL DEFAULT now(), "usuario_id" uuid, "subido_por_id" uuid, CONSTRAINT "PK_8e9b11350fa9df14f0b56cdf02a" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_DOC_USUARIO_ANIO" ON "documentos_usuario" ("año") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_DOC_USUARIO_TIPO" ON "documentos_usuario" ("tipo_documento") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_DOC_USUARIO_USUARIO_ID" ON "documentos_usuario" ("usuario_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_DOC_USUARIO_COMPOSITE" ON "documentos_usuario" ("usuario_id", "tipo_documento", "año") `,
    );
    await queryRunner.query(
      `CREATE TABLE "trabajadores" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "nombre" character varying(100) NOT NULL, "apellido" character varying(100), "telefono" character varying(20), "correo" character varying(100), "activo" boolean NOT NULL DEFAULT true, "creado_en" TIMESTAMP NOT NULL DEFAULT now(), "actualizado_en" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_572c7e550b3d755a9826d4a5daa" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_TRABAJADORES_ACTIVO" ON "trabajadores" ("activo") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."asistencia_personal_turno_enum" AS ENUM('matutino', 'vespertino')`,
    );
    await queryRunner.query(
      `CREATE TABLE "asistencia_personal" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "fecha" date NOT NULL, "hora_entrada" TIME, "hora_salida" TIME, "turno" "public"."asistencia_personal_turno_enum" NOT NULL DEFAULT 'matutino', "notas" text, "creado_en" TIMESTAMP NOT NULL DEFAULT now(), "actualizado_en" TIMESTAMP NOT NULL DEFAULT now(), "trabajador_id" uuid, "registrado_por_id" uuid, CONSTRAINT "PK_d6d39d850c7844bbb1a2a63508d" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_ASIST_PERSONAL_FECHA" ON "asistencia_personal" ("fecha") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_ASIST_PERSONAL_TRABAJADOR" ON "asistencia_personal" ("trabajador_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_ASIST_PERSONAL_COMPOSITE" ON "asistencia_personal" ("trabajador_id", "fecha") `,
    );
    await queryRunner.query(
      `CREATE TABLE "bonos_regalo" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "codigo" character varying(50) NOT NULL, "beneficiario_nombre" character varying(200) NOT NULL, "padre_nombre" character varying(200), "cedula" character varying(20), "monto" numeric(10,2) NOT NULL, "mes" character varying(100) NOT NULL, "expira" date, "entregado" boolean NOT NULL DEFAULT false, "foto_entrega" character varying, "creado_en" TIMESTAMP NOT NULL DEFAULT now(), "actualizado_en" TIMESTAMP NOT NULL DEFAULT now(), "beneficiario_id" uuid, "registrado_por_id" uuid, "entregado_por_id" uuid, CONSTRAINT "PK_12824924a7b75cdf7a07b8afdc8" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_BONO_REGALO_MES" ON "bonos_regalo" ("mes") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_BONO_REGALO_ENTREGADO" ON "bonos_regalo" ("entregado") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_BONO_REGALO_BENEFICIARIO" ON "bonos_regalo" ("beneficiario_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "club_beneficiario" ("club_id" uuid NOT NULL, "beneficiario_id" uuid NOT NULL, CONSTRAINT "PK_1592b0a495ee3f4bbea4d11e85c" PRIMARY KEY ("club_id", "beneficiario_id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_e95e8db3deac56aa8cc6a25b41" ON "club_beneficiario" ("club_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_538ff4c620f8cc04aed88f744b" ON "club_beneficiario" ("beneficiario_id") `,
    );
    await queryRunner.query(
      `ALTER TABLE "comentarios_ayuda" DROP CONSTRAINT IF EXISTS "FK_61d74bf0423c3468957fed8b79e"`,
    );
    await queryRunner.query(
      `ALTER TABLE "comentarios_ayuda" ALTER COLUMN "ayuda_id" DROP NOT NULL`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_PERMISOS_MODULO" ON "permisos" ("modulo") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_ROLES_SUPER_ADMIN" ON "roles" ("es_super_admin") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_ROLES_ACTIVO" ON "roles" ("activo") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_USUARIOS_ACTIVO" ON "usuarios" ("activo") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_USUARIOS_ROL_ID" ON "usuarios" ("rol_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_HORARIOS_ACTIVO" ON "horarios" ("activo") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_HORARIOS_DIA" ON "horarios" ("dia") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_ASISTENCIAS_REGISTRADO_POR" ON "asistencias" ("registrado_por_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_ASISTENCIAS_ESTADO" ON "asistencias" ("estado") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_ASISTENCIAS_FECHA" ON "asistencias" ("fecha") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_ASISTENCIAS_BENEFICIARIO_ID" ON "asistencias" ("beneficiario_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_ASISTENCIAS_CLASE_ID" ON "asistencias" ("clase_id") `,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_ASISTENCIAS_UNICA" ON "asistencias" ("clase_id", "beneficiario_id", "fecha") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_SUPERVIVENCIAS_ACTIVO" ON "supervivencias" ("activo") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_SUPERVIVENCIAS_CODIGO" ON "supervivencias" ("codigo") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_SUPERVIVENCIAS_TUTOR_ID" ON "supervivencias" ("tutor_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_EXPEDIENTES_FECHA_EVENTO" ON "beneficiario_expedientes" ("fecha_evento") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_EXPEDIENTES_TIPO" ON "beneficiario_expedientes" ("tipo") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_EXPEDIENTES_BENEFICIARIO_ID" ON "beneficiario_expedientes" ("beneficiario_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_BENEFICIARIOS_NOMBRE" ON "beneficiarios" ("nombre") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_BENEFICIARIOS_ACTIVO" ON "beneficiarios" ("activo") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_CLASES_ACTIVO" ON "clases" ("activo") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_CLASES_CODIGO" ON "clases" ("codigo") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_CLASES_TUTOR_ID" ON "clases" ("tutor_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_TUTORES_TIPO" ON "tutores" ("tipo") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_TUTORES_USUARIO_ID" ON "tutores" ("usuario_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_TUTORES_ACTIVO" ON "tutores" ("activo") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_TUTORES_CORREO" ON "tutores" ("correo") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_FOTOS_ASIST_FECHA" ON "fotos_asistencia" ("fecha") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_FOTOS_ASIST_CLASE_ID" ON "fotos_asistencia" ("clase_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_FOTOS_ASIST_CLASE_FECHA" ON "fotos_asistencia" ("clase_id", "fecha") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_REPORTES_GENERADO_POR_ID" ON "reportes" ("generado_por_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_REPORTES_FORMATO" ON "reportes" ("formato") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_REPORTES_TIPO" ON "reportes" ("tipo") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_ASIS_SUPERV_COMPOSITE" ON "asistencias_supervivencia" ("supervivencia_id", "fecha") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_ASIS_SUPERV_FECHA" ON "asistencias_supervivencia" ("fecha") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_ASIS_SUPERV_BENEFICIARIO_ID" ON "asistencias_supervivencia" ("beneficiario_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_ASIS_SUPERV_SUPERVIVENCIA_ID" ON "asistencias_supervivencia" ("supervivencia_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_FOTOS_SUPERV_FECHA" ON "fotos_asistencia_supervivencia" ("fecha") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_FOTOS_SUPERV_SUPERVIVENCIA_ID" ON "fotos_asistencia_supervivencia" ("supervivencia_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_FOTOS_SUPERV_COMPOSITE" ON "fotos_asistencia_supervivencia" ("supervivencia_id", "fecha") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_NOTAS_MERITO_CICLO" ON "notas_merito" ("ciclo") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_NOTAS_MERITO_BENEFICIARIO_ID" ON "notas_merito" ("beneficiario_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_NOTAS_MERITO_PERIODO_ID" ON "notas_merito" ("periodo_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_PERIODOS_MERITO_ESTADO" ON "periodos_merito" ("estado") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_PERIODOS_MERITO_ANIO" ON "periodos_merito" ("anio") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_AYUDAS_ESTADO" ON "ayudas" ("estado") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_AYUDAS_TIPO" ON "ayudas" ("tipo") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_AYUDAS_CODIGO_BENEF" ON "ayudas" ("codigo_beneficiario") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_COMENTARIOS_AYUDA_ID" ON "comentarios_ayuda" ("ayuda_id") `,
    );
    await queryRunner.query(
      `ALTER TABLE "asistencias" ADD CONSTRAINT "FK_3e0c95bd66a6ad20ea0dba73b50" FOREIGN KEY ("clase_id") REFERENCES "clases"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "asistencias" ADD CONSTRAINT "FK_4069bb7ae321bdd7f11f1bffbff" FOREIGN KEY ("beneficiario_id") REFERENCES "beneficiarios"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "asistencias" ADD CONSTRAINT "FK_e5ade4b83aef3ef6b9dc50af424" FOREIGN KEY ("registrado_por_id") REFERENCES "usuarios"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "asistencias_club" ADD CONSTRAINT "FK_d033d2d8b66ae38094f7dacad9e" FOREIGN KEY ("club_id") REFERENCES "clubes"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "asistencias_club" ADD CONSTRAINT "FK_87b7df5778b1fa1f1d014197854" FOREIGN KEY ("beneficiario_id") REFERENCES "beneficiarios"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "clubes" ADD CONSTRAINT "FK_de83ab9b83db4631481c08ddaa1" FOREIGN KEY ("tutor_id") REFERENCES "tutores"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "clases" ADD CONSTRAINT "FK_583e041b8782b1428a935aa227b" FOREIGN KEY ("tutor_id") REFERENCES "tutores"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "tutores" ADD CONSTRAINT "FK_df78929a64c965085e826eb38d4" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "fotos_asistencia" ADD CONSTRAINT "FK_c4eac2500362308868f159ec39f" FOREIGN KEY ("clase_id") REFERENCES "clases"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "reportes" ADD CONSTRAINT "FK_f4b1b3f90bb19493a091eb329fa" FOREIGN KEY ("generado_por_id") REFERENCES "usuarios"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "fotos_asistencia_club" ADD CONSTRAINT "FK_d39b6d0960afcf6f01c7eaaa8a7" FOREIGN KEY ("club_id") REFERENCES "clubes"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "documentos_usuario" ADD CONSTRAINT "FK_557dec97f33f2f2089704150d4b" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "documentos_usuario" ADD CONSTRAINT "FK_88ebfceed168d5c2923066ae06d" FOREIGN KEY ("subido_por_id") REFERENCES "usuarios"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "asistencia_personal" ADD CONSTRAINT "FK_ba01329abb67a8e9cf519bba1ef" FOREIGN KEY ("trabajador_id") REFERENCES "trabajadores"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "asistencia_personal" ADD CONSTRAINT "FK_a38effd4478eb4f9c75ac1968fd" FOREIGN KEY ("registrado_por_id") REFERENCES "usuarios"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "bonos_regalo" ADD CONSTRAINT "FK_0e693a8b27d1b1c4741d5edad10" FOREIGN KEY ("beneficiario_id") REFERENCES "beneficiarios"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "bonos_regalo" ADD CONSTRAINT "FK_49d75592ee2a66759de924732ed" FOREIGN KEY ("registrado_por_id") REFERENCES "usuarios"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "bonos_regalo" ADD CONSTRAINT "FK_2025e2fc4af8bf248cc7b1601fa" FOREIGN KEY ("entregado_por_id") REFERENCES "usuarios"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "comentarios_ayuda" ADD CONSTRAINT "FK_61d74bf0423c3468957fed8b79e" FOREIGN KEY ("ayuda_id") REFERENCES "ayudas"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "club_beneficiario" ADD CONSTRAINT "FK_e95e8db3deac56aa8cc6a25b41a" FOREIGN KEY ("club_id") REFERENCES "clubes"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "club_beneficiario" ADD CONSTRAINT "FK_538ff4c620f8cc04aed88f744b9" FOREIGN KEY ("beneficiario_id") REFERENCES "beneficiarios"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "club_beneficiario" DROP CONSTRAINT IF EXISTS "FK_538ff4c620f8cc04aed88f744b9"`,
    );
    await queryRunner.query(
      `ALTER TABLE "club_beneficiario" DROP CONSTRAINT IF EXISTS "FK_e95e8db3deac56aa8cc6a25b41a"`,
    );
    await queryRunner.query(
      `ALTER TABLE "comentarios_ayuda" DROP CONSTRAINT IF EXISTS "FK_61d74bf0423c3468957fed8b79e"`,
    );
    await queryRunner.query(
      `ALTER TABLE "bonos_regalo" DROP CONSTRAINT IF EXISTS "FK_2025e2fc4af8bf248cc7b1601fa"`,
    );
    await queryRunner.query(
      `ALTER TABLE "bonos_regalo" DROP CONSTRAINT IF EXISTS "FK_49d75592ee2a66759de924732ed"`,
    );
    await queryRunner.query(
      `ALTER TABLE "bonos_regalo" DROP CONSTRAINT IF EXISTS "FK_0e693a8b27d1b1c4741d5edad10"`,
    );
    await queryRunner.query(
      `ALTER TABLE "asistencia_personal" DROP CONSTRAINT IF EXISTS "FK_a38effd4478eb4f9c75ac1968fd"`,
    );
    await queryRunner.query(
      `ALTER TABLE "asistencia_personal" DROP CONSTRAINT IF EXISTS "FK_ba01329abb67a8e9cf519bba1ef"`,
    );
    await queryRunner.query(
      `ALTER TABLE "documentos_usuario" DROP CONSTRAINT IF EXISTS "FK_88ebfceed168d5c2923066ae06d"`,
    );
    await queryRunner.query(
      `ALTER TABLE "documentos_usuario" DROP CONSTRAINT IF EXISTS "FK_557dec97f33f2f2089704150d4b"`,
    );
    await queryRunner.query(
      `ALTER TABLE "fotos_asistencia_club" DROP CONSTRAINT IF EXISTS "FK_d39b6d0960afcf6f01c7eaaa8a7"`,
    );
    await queryRunner.query(
      `ALTER TABLE "reportes" DROP CONSTRAINT IF EXISTS "FK_f4b1b3f90bb19493a091eb329fa"`,
    );
    await queryRunner.query(
      `ALTER TABLE "fotos_asistencia" DROP CONSTRAINT IF EXISTS "FK_c4eac2500362308868f159ec39f"`,
    );
    await queryRunner.query(
      `ALTER TABLE "tutores" DROP CONSTRAINT IF EXISTS "FK_df78929a64c965085e826eb38d4"`,
    );
    await queryRunner.query(
      `ALTER TABLE "clases" DROP CONSTRAINT IF EXISTS "FK_583e041b8782b1428a935aa227b"`,
    );
    await queryRunner.query(
      `ALTER TABLE "clubes" DROP CONSTRAINT IF EXISTS "FK_de83ab9b83db4631481c08ddaa1"`,
    );
    await queryRunner.query(
      `ALTER TABLE "asistencias_club" DROP CONSTRAINT IF EXISTS "FK_87b7df5778b1fa1f1d014197854"`,
    );
    await queryRunner.query(
      `ALTER TABLE "asistencias_club" DROP CONSTRAINT IF EXISTS "FK_d033d2d8b66ae38094f7dacad9e"`,
    );
    await queryRunner.query(
      `ALTER TABLE "asistencias" DROP CONSTRAINT IF EXISTS "FK_e5ade4b83aef3ef6b9dc50af424"`,
    );
    await queryRunner.query(
      `ALTER TABLE "asistencias" DROP CONSTRAINT IF EXISTS "FK_4069bb7ae321bdd7f11f1bffbff"`,
    );
    await queryRunner.query(
      `ALTER TABLE "asistencias" DROP CONSTRAINT IF EXISTS "FK_3e0c95bd66a6ad20ea0dba73b50"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."IDX_COMENTARIOS_AYUDA_ID"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."IDX_AYUDAS_CODIGO_BENEF"`,
    );
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_AYUDAS_TIPO"`);
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."IDX_AYUDAS_ESTADO"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."IDX_PERIODOS_MERITO_ANIO"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."IDX_PERIODOS_MERITO_ESTADO"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."IDX_NOTAS_MERITO_PERIODO_ID"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."IDX_NOTAS_MERITO_BENEFICIARIO_ID"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."IDX_NOTAS_MERITO_CICLO"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."IDX_FOTOS_SUPERV_COMPOSITE"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."IDX_FOTOS_SUPERV_SUPERVIVENCIA_ID"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."IDX_FOTOS_SUPERV_FECHA"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."IDX_ASIS_SUPERV_SUPERVIVENCIA_ID"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."IDX_ASIS_SUPERV_BENEFICIARIO_ID"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."IDX_ASIS_SUPERV_FECHA"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."IDX_ASIS_SUPERV_COMPOSITE"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."IDX_REPORTES_TIPO"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."IDX_REPORTES_FORMATO"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."IDX_REPORTES_GENERADO_POR_ID"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."IDX_FOTOS_ASIST_CLASE_FECHA"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."IDX_FOTOS_ASIST_CLASE_ID"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."IDX_FOTOS_ASIST_FECHA"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."IDX_TUTORES_CORREO"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."IDX_TUTORES_ACTIVO"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."IDX_TUTORES_USUARIO_ID"`,
    );
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_TUTORES_TIPO"`);
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."IDX_CLASES_TUTOR_ID"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."IDX_CLASES_CODIGO"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."IDX_CLASES_ACTIVO"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."IDX_BENEFICIARIOS_ACTIVO"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."IDX_BENEFICIARIOS_NOMBRE"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."IDX_EXPEDIENTES_BENEFICIARIO_ID"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."IDX_EXPEDIENTES_TIPO"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."IDX_EXPEDIENTES_FECHA_EVENTO"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."IDX_SUPERVIVENCIAS_TUTOR_ID"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."IDX_SUPERVIVENCIAS_CODIGO"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."IDX_SUPERVIVENCIAS_ACTIVO"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."IDX_ASISTENCIAS_UNICA"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."IDX_ASISTENCIAS_CLASE_ID"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."IDX_ASISTENCIAS_BENEFICIARIO_ID"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."IDX_ASISTENCIAS_FECHA"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."IDX_ASISTENCIAS_ESTADO"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."IDX_ASISTENCIAS_REGISTRADO_POR"`,
    );
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_HORARIOS_DIA"`);
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."IDX_HORARIOS_ACTIVO"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."IDX_USUARIOS_ROL_ID"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."IDX_USUARIOS_ACTIVO"`,
    );
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_ROLES_ACTIVO"`);
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."IDX_ROLES_SUPER_ADMIN"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."IDX_PERMISOS_MODULO"`,
    );
    await queryRunner.query(
      `ALTER TABLE "comentarios_ayuda" ALTER COLUMN "ayuda_id" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "comentarios_ayuda" ADD CONSTRAINT "FK_61d74bf0423c3468957fed8b79e" FOREIGN KEY ("ayuda_id") REFERENCES "ayudas"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."IDX_538ff4c620f8cc04aed88f744b"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."IDX_e95e8db3deac56aa8cc6a25b41"`,
    );
    await queryRunner.query(`DROP TABLE "club_beneficiario"`);
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."IDX_BONO_REGALO_BENEFICIARIO"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."IDX_BONO_REGALO_ENTREGADO"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."IDX_BONO_REGALO_MES"`,
    );
    await queryRunner.query(`DROP TABLE "bonos_regalo"`);
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."IDX_ASIST_PERSONAL_COMPOSITE"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."IDX_ASIST_PERSONAL_TRABAJADOR"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."IDX_ASIST_PERSONAL_FECHA"`,
    );
    await queryRunner.query(`DROP TABLE "asistencia_personal"`);
    await queryRunner.query(
      `DROP TYPE "public"."asistencia_personal_turno_enum"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."IDX_TRABAJADORES_ACTIVO"`,
    );
    await queryRunner.query(`DROP TABLE "trabajadores"`);
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."IDX_DOC_USUARIO_COMPOSITE"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."IDX_DOC_USUARIO_USUARIO_ID"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."IDX_DOC_USUARIO_TIPO"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."IDX_DOC_USUARIO_ANIO"`,
    );
    await queryRunner.query(`DROP TABLE "documentos_usuario"`);
    await queryRunner.query(
      `DROP TYPE "public"."documentos_usuario_tipo_documento_enum"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."IDX_FOTOS_CLUB_COMPOSITE"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."IDX_FOTOS_CLUB_CLUB_ID"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."IDX_FOTOS_CLUB_FECHA"`,
    );
    await queryRunner.query(`DROP TABLE "fotos_asistencia_club"`);
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."IDX_CLUBES_TUTOR_ID"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."IDX_CLUBES_CODIGO"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."IDX_CLUBES_ACTIVO"`,
    );
    await queryRunner.query(`DROP TABLE "clubes"`);
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."IDX_ASIS_CLUB_CLUB_ID"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."IDX_ASIS_CLUB_BENEFICIARIO_ID"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."IDX_ASIS_CLUB_FECHA"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."IDX_ASIS_CLUB_COMPOSITE"`,
    );
    await queryRunner.query(`DROP TABLE "asistencias_club"`);
    await queryRunner.query(
      `CREATE INDEX "IDX_cae84e9cd95d20272333e3b53f" ON "fotos_asistencia_supervivencia" ("fecha", "supervivencia_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_6d752ba2923c0929b12d51f524" ON "fotos_asistencia" ("clase_id", "fecha") `,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_255b2419764a1c1b33bd2d3ce8" ON "asistencias" ("beneficiario_id", "clase_id", "fecha") `,
    );
    await queryRunner.query(
      `ALTER TABLE "reportes" ADD CONSTRAINT "FK_reportes_generado_por" FOREIGN KEY ("generado_por_id") REFERENCES "usuarios"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "fotos_asistencia" ADD CONSTRAINT "FK_fotos_asist_clase" FOREIGN KEY ("clase_id") REFERENCES "clases"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "tutores" ADD CONSTRAINT "FK_tutores_usuario" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "clases" ADD CONSTRAINT "FK_clases_tutor" FOREIGN KEY ("tutor_id") REFERENCES "tutores"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "asistencias" ADD CONSTRAINT "FK_asistencias_beneficiario" FOREIGN KEY ("beneficiario_id") REFERENCES "beneficiarios"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "asistencias" ADD CONSTRAINT "FK_asistencias_clase" FOREIGN KEY ("clase_id") REFERENCES "clases"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "asistencias" ADD CONSTRAINT "FK_asistencias_registrado_por" FOREIGN KEY ("registrado_por_id") REFERENCES "usuarios"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }
}
