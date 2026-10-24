import * as pg from 'pg';
import { DataSource, QueryRunner } from 'typeorm';
import { PaseListaTutorService } from '../src/modules/asistencias/pase-lista-tutor.service';
import { AddEncuentrosClub1792800000000 } from '../src/migrations/1792800000000-AddEncuentrosClub';

interface PgTestClient {
  connect(): Promise<void>;
  end(): Promise<void>;
  query(
    sql: string,
    params?: unknown[],
  ): Promise<{ rows: Record<string, unknown>[] }>;
}
const { Client } = pg as unknown as {
  Client: new (options: {
    connectionString?: string;
    connectionTimeoutMillis: number;
  }) => PgTestClient;
};

// Fijar la conexión dentro de una transacción y revertirla al terminar: cerrar
// un cliente de PgBouncer no necesariamente descarta sus tablas temporales.
const describeDatabase = process.env.TEST_DATABASE_URL
  ? describe
  : describe.skip;
describeDatabase(
  'Pase de lista y migración en PostgreSQL (tablas temporales)',
  () => {
    const client = new Client({
      connectionString: process.env.TEST_DATABASE_URL,
      connectionTimeoutMillis: 10000,
    });
    const service = new PaseListaTutorService({
      getRepository: () => ({
        findOne: () =>
          Promise.resolve({
            id: 'tutor-a',
            nombre: 'Ana',
            apellido: 'Pérez',
          }),
      }),
      query: async (sql: string, params: unknown[]) =>
        (await client.query(sql, params)).rows,
    } as unknown as DataSource);

    beforeAll(async () => {
      await client.connect();
      await client.query('BEGIN');
      await client.query(`
      CREATE TEMP TABLE clases (id text PRIMARY KEY, tutor_id text, nombre text, codigo text, activo boolean, creado_en timestamp);
      CREATE TEMP TABLE clubes (LIKE clases INCLUDING ALL);
      CREATE TEMP TABLE supervivencias (LIKE clases INCLUDING ALL);
      CREATE TEMP TABLE beneficiarios (id text PRIMARY KEY, activo boolean);
      CREATE TEMP TABLE clase_beneficiario (clase_id text, beneficiario_id text);
      CREATE TEMP TABLE club_beneficiario (club_id text, beneficiario_id text);
      CREATE TEMP TABLE supervivencia_beneficiario (supervivencia_id text, beneficiario_id text);
      CREATE TEMP TABLE horarios (id text, dia text, activo boolean);
      CREATE TEMP TABLE clase_horario (clase_id text, horario_id text);
      CREATE TEMP TABLE asistencias (clase_id text, beneficiario_id text, fecha date);
      CREATE TEMP TABLE asistencias_club (club_id text, beneficiario_id text, fecha date);
      CREATE TEMP TABLE asistencias_supervivencia (supervivencia_id text, beneficiario_id text, fecha date);
      CREATE TEMP TABLE fotos_asistencia_club (club_id text, fecha date);
      CREATE TEMP TABLE encuentros_supervivencia (supervivencia_id text, fecha date);
      CREATE TEMP TABLE encuentros_club (id uuid DEFAULT gen_random_uuid(), club_id text, fecha date, UNIQUE(club_id,fecha));
      INSERT INTO clases VALUES
        ('a','tutor-a','Clase A','A',true,'2020-10-01'),
        ('late','tutor-a','Clase nueva','N',true,'2020-10-20'),
        ('empty','tutor-a','Sin inscritos','E',true,'2020-10-01'),
        ('other','tutor-b','Otro tutor','O',true,'2020-10-01');
      INSERT INTO clubes VALUES ('club','tutor-a','Club B','B',true,'2020-10-01');
      INSERT INTO supervivencias VALUES ('curso','tutor-a','Curso C','C',true,'2020-10-01');
      INSERT INTO beneficiarios VALUES ('b1',true),('b2',true),('inactivo',false);
      INSERT INTO clase_beneficiario VALUES ('a','b1'),('a','b2'),('a','inactivo'),('late','b1'),('other','b1');
      INSERT INTO club_beneficiario VALUES ('club','b1');
      INSERT INTO supervivencia_beneficiario VALUES ('curso','b1'),('curso','b2');
      INSERT INTO horarios VALUES ('h1','miercoles',true),('h2','miercoles',true),('off','sabado',false);
      INSERT INTO clase_horario VALUES ('a','h1'),('a','h2'),('a','off'),('late','h1'),('empty','h1'),('other','h1');
      INSERT INTO encuentros_club (club_id,fecha) VALUES ('club','2020-10-08'),('club','2020-10-22'),('club','2099-10-08');
      INSERT INTO encuentros_supervivencia VALUES ('curso','2020-10-09'),('curso','2020-10-23');
      INSERT INTO asistencias VALUES ('a','b1','2020-10-07'),('a','b2','2020-10-07'),('a','b1','2020-10-14'),('other','b1','2020-10-21');
      INSERT INTO asistencias_club VALUES ('club','b1','2020-10-08');
      INSERT INTO asistencias_supervivencia VALUES ('curso','b1','2020-10-09'),('curso','b2','2020-10-09');
      INSERT INTO fotos_asistencia_club VALUES ('club','2020-10-22');
    `);
    }, 20000);
    afterAll(async () => {
      try {
        await client.query('ROLLBACK');
      } finally {
        await client.end();
      }
    });

    it('compara horarios, fechas configuradas y registros sin duplicar días ni mezclar tutores', async () => {
      const reporte = await service.generar('tutor-a', {
        fechaInicio: '2020-10-01',
        fechaFin: '2020-10-31',
      });
      expect(reporte.sesiones).toHaveLength(10);
      expect(
        reporte.sesiones.some((s) =>
          ['other', 'empty'].includes(s.actividadId),
        ),
      ).toBe(false);
      expect(
        reporte.sesiones
          .filter((s) => s.actividadId === 'late')
          .map((s) => s.fecha),
      ).toEqual(['2020-10-21', '2020-10-28']);
      expect(reporte.estadisticas).toMatchObject({
        sesionesSinRegistro: 6,
        diasSinRegistro: 4,
        sesionesRegistradas: 3,
        sesionesParciales: 1,
      });
      expect(
        reporte.sesiones.find(
          (s) => s.actividadId === 'club' && s.fecha === '2020-10-22',
        )?.estado,
      ).toBe('sin_registro');
    });
    it('respeta un día o una semana específica y excluye encuentros sin programar', async () => {
      const dia = await service.generar('tutor-a', {
        fechaInicio: '2020-10-07',
        fechaFin: '2020-10-07',
      });
      expect(dia.sesiones).toHaveLength(1);
      expect(dia.sesiones[0].estado).toBe('registrada');
      const semana = await service.generar('tutor-a', {
        fechaInicio: '2020-10-19',
        fechaFin: '2020-10-25',
      });
      expect(semana.estadisticas.sesionesSinRegistro).toBe(4);
      expect(semana.estadisticas.diasSinRegistro).toBe(3);
    });
    it('no cuenta los encuentros futuros como listas omitidas', async () => {
      const reporte = await service.generar('tutor-a', {
        fechaInicio: '2099-10-08',
        fechaFin: '2099-10-08',
      });
      expect(reporte.sesiones.find((s) => s.tipo === 'club')?.estado).toBe(
        'programada',
      );
      expect(reporte.estadisticas.sesionesSinRegistro).toBe(0);
    });
    it('la migración conserva fechas históricas de asistencia y fotos', async () => {
      // La tabla creada por la migración también debe ser TEMP y tener FK de UUID:
      // la ejercitamos en tablas temporales propias sin tocar las tablas reales.
      const queries: string[] = [];
      const migration = new AddEncuentrosClub1792800000000();
      await migration.up({
        query: (sql: string) => {
          queries.push(sql);
          if (sql.includes('CREATE TABLE')) {
            return client.query(
              sql
                .replace('CREATE TABLE', 'CREATE TEMP TABLE')
                .replaceAll(
                  '"public"."encuentros_club"',
                  '"verificacion_encuentros"',
                )
                .replaceAll('"public".', '"pg_temp".')
                .replace('"club_id" uuid', '"club_id" text'),
            );
          }
          return client.query(
            sql
              .replaceAll(
                '"public"."encuentros_club"',
                '"verificacion_encuentros"',
              )
              .replaceAll('"public".', '"pg_temp".'),
          );
        },
      } as unknown as QueryRunner);
      const resultado = await client.query(
        'SELECT fecha::text FROM verificacion_encuentros ORDER BY fecha',
      );
      expect(resultado.rows).toEqual([
        { fecha: '2020-10-08' },
        { fecha: '2020-10-22' },
      ]);
      expect(queries).toHaveLength(3);
    });
  },
);
