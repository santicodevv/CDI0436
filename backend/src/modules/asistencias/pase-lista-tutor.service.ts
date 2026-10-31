import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { Tutor } from '../tutores/tutor.entity';
import { ReportePaseListaDto } from './dto/reporte-pase-lista.dto';

export type EstadoPaseLista =
  | 'sin_registro'
  | 'parcial'
  | 'registrada'
  | 'pendiente_hoy'
  | 'programada';
export interface SesionTutor {
  fecha: string;
  tipo: 'clase' | 'club' | 'supervivencia';
  actividadId: string;
  actividad: string;
  codigo: string | null;
  inscritos: number;
  registrados: number;
  estado: EstadoPaseLista;
}

export function clasificarPaseLista(
  fecha: string,
  registrados: number,
  inscritos: number,
  hoy: string,
): EstadoPaseLista {
  if (registrados > 0)
    return registrados < inscritos ? 'parcial' : 'registrada';
  if (fecha > hoy) return 'programada';
  if (fecha === hoy) return 'pendiente_hoy';
  return 'sin_registro';
}

@Injectable()
export class PaseListaTutorService {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  async generar(tutorId: string, filtros: ReportePaseListaDto) {
    const { fechaInicio, fechaFin } = filtros;
    const inicio = new Date(`${fechaInicio}T00:00:00Z`);
    const fin = new Date(`${fechaFin}T00:00:00Z`);
    if (
      ![fechaInicio, fechaFin].every((f) =>
        /^[1-9]\d{3}-\d{2}-\d{2}$/.test(f),
      ) ||
      !Number.isFinite(inicio.getTime()) ||
      !Number.isFinite(fin.getTime()) ||
      inicio.toISOString().slice(0, 10) !== fechaInicio ||
      fin.toISOString().slice(0, 10) !== fechaFin ||
      fechaInicio > fechaFin ||
      fin.getTime() - inicio.getTime() > 366 * 86400000
    ) {
      throw new BadRequestException(
        'Selecciona un rango válido de hasta un año',
      );
    }
    const tutor = await this.dataSource
      .getRepository(Tutor)
      .findOne({ where: { id: tutorId } });
    if (!tutor) throw new NotFoundException('Tutor no encontrado');
    // RD y el centro usan UTC-4; no depender de la zona horaria del contenedor.
    const hoy = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/Santo_Domingo',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date());
    const filas = await this.dataSource.query<
      Array<Omit<SesionTutor, 'estado'>>
    >(
      `
      WITH dias AS (
        SELECT d::date AS fecha FROM generate_series($2::date, $3::date, interval '1 day') d
      ), actividades AS (
        SELECT 'clase'::text AS tipo, c.id, c.nombre, c.codigo,
          (SELECT count(*)::int FROM clase_beneficiario cb JOIN beneficiarios b ON b.id=cb.beneficiario_id AND b.activo=true WHERE cb.clase_id=c.id) AS inscritos
        FROM clases c WHERE c.tutor_id=$1 AND c.activo=true
        UNION ALL
        SELECT 'club', c.id, c.nombre, c.codigo,
          (SELECT count(*)::int FROM club_beneficiario cb JOIN beneficiarios b ON b.id=cb.beneficiario_id AND b.activo=true WHERE cb.club_id=c.id)
        FROM clubes c WHERE c.tutor_id=$1 AND c.activo=true
        UNION ALL
        SELECT 'supervivencia', c.id, c.nombre, c.codigo,
          (SELECT count(*)::int FROM supervivencia_beneficiario cb JOIN beneficiarios b ON b.id=cb.beneficiario_id AND b.activo=true WHERE cb.supervivencia_id=c.id)
        FROM supervivencias c WHERE c.tutor_id=$1 AND c.activo=true
      ), registros AS (
        SELECT 'clase'::text AS tipo, a.clase_id AS id, a.fecha, count(DISTINCT a.beneficiario_id)::int AS cantidad
        FROM asistencias a JOIN clases c ON c.id=a.clase_id AND c.tutor_id=$1
        WHERE a.fecha BETWEEN $2::date AND $3::date GROUP BY a.clase_id,a.fecha
        UNION ALL
        SELECT 'club', a.club_id, a.fecha, count(DISTINCT a.beneficiario_id)::int
        FROM asistencias_club a JOIN clubes c ON c.id=a.club_id AND c.tutor_id=$1
        WHERE a.fecha BETWEEN $2::date AND $3::date GROUP BY a.club_id,a.fecha
        UNION ALL
        SELECT 'supervivencia', a.supervivencia_id, a.fecha, count(DISTINCT a.beneficiario_id)::int
        FROM asistencias_supervivencia a JOIN supervivencias c ON c.id=a.supervivencia_id AND c.tutor_id=$1
        WHERE a.fecha BETWEEN $2::date AND $3::date GROUP BY a.supervivencia_id,a.fecha
      ), esperadas AS (
        SELECT DISTINCT 'clase'::text AS tipo, c.id, d.fecha
        FROM clases c JOIN clase_horario ch ON ch.clase_id=c.id
        JOIN horarios h ON h.id=ch.horario_id AND h.activo=true
        CROSS JOIN dias d
        WHERE c.tutor_id=$1 AND c.activo=true AND d.fecha>=c.creado_en::date
          AND EXTRACT(ISODOW FROM d.fecha)::int = CASE h.dia::text
            WHEN 'lunes' THEN 1 WHEN 'martes' THEN 2 WHEN 'miercoles' THEN 3
            WHEN 'jueves' THEN 4 WHEN 'viernes' THEN 5 WHEN 'sabado' THEN 6 WHEN 'domingo' THEN 7 END
        UNION
        SELECT 'club', e.club_id, e.fecha FROM encuentros_club e
        JOIN clubes c ON c.id=e.club_id AND c.tutor_id=$1 AND c.activo=true
        WHERE e.fecha BETWEEN $2::date AND $3::date
        UNION
        SELECT 'supervivencia', e.supervivencia_id, e.fecha FROM encuentros_supervivencia e
        JOIN supervivencias c ON c.id=e.supervivencia_id AND c.tutor_id=$1 AND c.activo=true
        WHERE e.fecha BETWEEN $2::date AND $3::date
        UNION
        SELECT tipo, id, fecha FROM registros
      )
      SELECT e.fecha::text AS fecha, a.tipo, a.id AS "actividadId", a.nombre AS actividad,
        a.codigo, a.inscritos, COALESCE(r.cantidad,0)::int AS registrados
      FROM esperadas e JOIN actividades a ON a.tipo=e.tipo AND a.id=e.id
      LEFT JOIN registros r ON r.tipo=e.tipo AND r.id=e.id AND r.fecha=e.fecha
      WHERE a.inscritos>0 ORDER BY e.fecha,a.tipo,a.nombre,a.id
    `,
      [tutorId, fechaInicio, fechaFin],
    );
    const sesiones: SesionTutor[] = filas.map((fila) => ({
      ...fila,
      estado: clasificarPaseLista(
        fila.fecha,
        fila.registrados,
        fila.inscritos,
        hoy,
      ),
    }));
    const sinRegistro = sesiones.filter((s) => s.estado === 'sin_registro');
    return {
      tutor: {
        id: tutor.id,
        nombre: `${tutor.nombre} ${tutor.apellido || ''}`.trim(),
      },
      periodo: { fechaInicio, fechaFin, hoy },
      estadisticas: {
        sesionesProgramadas: sesiones.length,
        sesionesSinRegistro: sinRegistro.length,
        diasSinRegistro: new Set(sinRegistro.map((s) => s.fecha)).size,
        sesionesRegistradas: sesiones.filter((s) => s.estado === 'registrada')
          .length,
        sesionesParciales: sesiones.filter((s) => s.estado === 'parcial')
          .length,
        pendientesHoy: sesiones.filter((s) => s.estado === 'pendiente_hoy')
          .length,
      },
      sesiones,
      nota: 'Basado en tutores, horarios e inscripciones actuales. Las fotos solas no cuentan como lista. Hoy y las fechas futuras no se cuentan como días sin registro.',
    };
  }
}
