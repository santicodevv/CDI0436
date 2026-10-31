import { DiaSemana } from '../horarios/horario.entity';

const DIAS: DiaSemana[] = [
  DiaSemana.DOMINGO,
  DiaSemana.LUNES,
  DiaSemana.MARTES,
  DiaSemana.MIERCOLES,
  DiaSemana.JUEVES,
  DiaSemana.VIERNES,
  DiaSemana.SABADO,
];

// Días del periodo que tocan según el horario, más cualquier día con lista
// registrada fuera de horario para no perder esos datos.
export function fechasClaseEnPeriodo(
  horarios: { dia: DiaSemana; activo: boolean }[],
  fechasRegistro: string[],
  fechaInicio: string,
  fechaFin: string,
): string[] {
  const dias = new Set(horarios.filter((h) => h.activo).map((h) => h.dia));
  const fechas = new Set(
    fechasRegistro.filter((f) => f >= fechaInicio && f <= fechaFin),
  );
  for (
    const cursor = new Date(`${fechaInicio}T00:00:00Z`);
    cursor.toISOString().slice(0, 10) <= fechaFin;
    cursor.setUTCDate(cursor.getUTCDate() + 1)
  ) {
    if (dias.has(DIAS[cursor.getUTCDay()]))
      fechas.add(cursor.toISOString().slice(0, 10));
  }
  return [...fechas].sort();
}
