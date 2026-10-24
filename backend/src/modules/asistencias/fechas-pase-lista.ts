import { BadRequestException } from '@nestjs/common';
import { DiaSemana } from '../horarios/horario.entity';

export function validarPeriodoTutor(fechaInicio?: string, fechaFin?: string) {
  for (const fecha of [fechaInicio, fechaFin]) {
    if (fecha === undefined) continue;
    const parsed = new Date(`${fecha}T00:00:00Z`);
    if (
      !/^[1-9]\d{3}-\d{2}-\d{2}$/.test(fecha) ||
      !Number.isFinite(parsed.getTime()) ||
      parsed.toISOString().slice(0, 10) !== fecha
    ) {
      throw new BadRequestException(
        'Selecciona fechas válidas para el reporte',
      );
    }
  }
  if (fechaInicio && fechaFin && fechaInicio > fechaFin) {
    throw new BadRequestException(
      'La fecha inicial no puede ser posterior a la final',
    );
  }
}

const DIAS: DiaSemana[] = [
  DiaSemana.DOMINGO,
  DiaSemana.LUNES,
  DiaSemana.MARTES,
  DiaSemana.MIERCOLES,
  DiaSemana.JUEVES,
  DiaSemana.VIERNES,
  DiaSemana.SABADO,
];

export function fechasSinListaClase(
  horarios: { dia: DiaSemana; activo: boolean }[],
  fechasRegistro: string[],
  creadoEn: Date,
  fechaInicio: string | undefined,
  fechaFin: string | undefined,
  hoy: string,
): string[] {
  const creacion = creadoEn.toISOString().slice(0, 10);
  const inicio = fechaInicio && fechaInicio > creacion ? fechaInicio : creacion;
  const fin = fechaFin && fechaFin < hoy ? fechaFin : hoy;
  const dias = new Set(horarios.filter((h) => h.activo).map((h) => h.dia));
  const registradas = new Set(fechasRegistro);
  const pendientes: string[] = [];
  if (!dias.size || inicio > fin) return pendientes;
  // Hoy aún puede registrarse; solo los días anteriores cuentan como omitidos.
  for (
    const cursor = new Date(`${inicio}T00:00:00Z`);
    cursor.toISOString().slice(0, 10) <= fin;
    cursor.setUTCDate(cursor.getUTCDate() + 1)
  ) {
    const fecha = cursor.toISOString().slice(0, 10);
    if (
      fecha < hoy &&
      dias.has(DIAS[cursor.getUTCDay()]) &&
      !registradas.has(fecha)
    )
      pendientes.push(fecha);
  }
  return pendientes;
}
