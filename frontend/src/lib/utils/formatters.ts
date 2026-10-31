import type { TipoPeriodo } from '@/lib/types';

// ── Constants ───────────────────────────────────────────────────────────────

export const meses = [
  { value: '01', label: 'Enero' },
  { value: '02', label: 'Febrero' },
  { value: '03', label: 'Marzo' },
  { value: '04', label: 'Abril' },
  { value: '05', label: 'Mayo' },
  { value: '06', label: 'Junio' },
  { value: '07', label: 'Julio' },
  { value: '08', label: 'Agosto' },
  { value: '09', label: 'Septiembre' },
  { value: '10', label: 'Octubre' },
  { value: '11', label: 'Noviembre' },
  { value: '12', label: 'Diciembre' },
];

export const anios = Array.from({ length: 5 }, (_, i) => {
  const year = new Date().getFullYear() - i;
  return { value: year.toString(), label: year.toString() };
});

// ── Date formatting ─────────────────────────────────────────────────────────

export const formatFechaEs = (fechaStr: string): string => {
  if (!fechaStr) return '-';
  const cleanDateStr = fechaStr.includes('T') ? fechaStr.split('T')[0] : fechaStr;
  const [year, month, day] = cleanDateStr.split('-').map(Number);
  const date = new Date(year, month - 1, day);

  const diasSemana = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  const diaSemana = diasSemana[date.getDay()];

  const diaFormateado = day.toString().padStart(2, '0');
  const mesFormateado = month.toString().padStart(2, '0');

  return `${diaSemana} ${diaFormateado}/${mesFormateado}`;
};

export const formatFechasExport = (registros: { estado?: string; fecha: string }[], estado: string): string => {
  return (registros || [])
    .filter(r => r.estado?.toLowerCase() === estado.toLowerCase())
    .map(r => formatFechaEs(r.fecha))
    .join(', ') || '-';
};

// "2023-09-01" → "01/09/2023"
export const fechaDdMmAaaa = (fecha: string): string =>
  `${fecha.slice(8, 10)}/${fecha.slice(5, 7)}/${fecha.slice(0, 4)}`;

// "2023-09-01" → "Septiembre 2023"
export const nombreMesAnio = (fecha: string): string =>
  `${meses.find((m) => m.value === fecha.slice(5, 7))?.label ?? ''} ${fecha.slice(0, 4)}`.trim();

// ── Period calculation ───────────────────────────────────────────────────────

export function calcularFechasPeriodo(params: {
  tipoPeriodo: TipoPeriodo;
  fechaDia: string;
  mesSeleccionado: string;
  anioSeleccionado: string;
  fechaInicio: string;
  fechaFin: string;
}): { fechaInicio?: string; fechaFin?: string } {
  const { tipoPeriodo, fechaDia, mesSeleccionado, anioSeleccionado, fechaInicio, fechaFin } = params;

  switch (tipoPeriodo) {
    case 'dia':
      return { fechaInicio: fechaDia, fechaFin: fechaDia };
    case 'mes':
      if (mesSeleccionado && anioSeleccionado) {
        const ultimoDia = new Date(parseInt(anioSeleccionado), parseInt(mesSeleccionado), 0).getDate();
        return {
          fechaInicio: `${anioSeleccionado}-${mesSeleccionado}-01`,
          fechaFin: `${anioSeleccionado}-${mesSeleccionado}-${ultimoDia.toString().padStart(2, '0')}`,
        };
      }
      return {};
    case 'anio':
      if (anioSeleccionado) {
        return { fechaInicio: `${anioSeleccionado}-01-01`, fechaFin: `${anioSeleccionado}-12-31` };
      }
      return {};
    case 'rango':
      return { fechaInicio, fechaFin };
    case 'todo':
    default:
      return {};
  }
}

export function obtenerDescripcionPeriodo(params: {
  tipoPeriodo: TipoPeriodo;
  fechaDia: string;
  mesSeleccionado: string;
  anioSeleccionado: string;
  fechaInicio: string;
  fechaFin: string;
}): string {
  const { tipoPeriodo, fechaDia, mesSeleccionado, anioSeleccionado, fechaInicio, fechaFin } = params;

  switch (tipoPeriodo) {
    case 'dia':
      return fechaDia
        ? new Date(fechaDia + 'T00:00:00').toLocaleDateString('es-DO', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })
        : '';
    case 'mes': {
      const mes = meses.find(m => m.value === mesSeleccionado);
      return mes ? `${mes.label} ${anioSeleccionado}` : '';
    }
    case 'anio':
      return `Año ${anioSeleccionado}`;
    case 'rango':
      if (fechaInicio && fechaFin) {
        return `${new Date(fechaInicio + 'T00:00:00').toLocaleDateString('es-DO')} - ${new Date(fechaFin + 'T00:00:00').toLocaleDateString('es-DO')}`;
      }
      return '';
    case 'todo':
      return 'Todo el historial';
    default:
      return '';
  }
}

// ── Age calculation ──────────────────────────────────────────────────────────

export function calcularEdad(fechaNacimiento: string | Date | null | undefined): number | null {
  if (!fechaNacimiento) return null;
  const hoy = new Date();
  const nacimiento = typeof fechaNacimiento === 'string' ? new Date(fechaNacimiento + 'T00:00:00') : fechaNacimiento;
  if (isNaN(nacimiento.getTime())) return null;
  let edad = hoy.getFullYear() - nacimiento.getFullYear();
  const mes = hoy.getMonth() - nacimiento.getMonth();
  if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) {
    edad--;
  }
  return edad;
}

// ── Turno label ──────────────────────────────────────────────────────────────

export function getTurnoLabel(hora_inicio: string): string {
  if (!hora_inicio) return '';
  const [h] = hora_inicio.split(':').map(Number);
  if (h < 12) return 'Mañana';
  if (h < 18) return 'Tarde';
  return 'Noche';
}

// ── Promedio calculation ──────────────────────────────────────────────────────

export function calcularPromedioNotas(values: {
  matematicas: string;
  lengua_espanola: string;
  naturales: string;
  sociales: string;
}): string {
  const { matematicas, lengua_espanola, naturales, sociales } = values;
  if (matematicas && lengua_espanola && naturales && sociales) {
    return (
      (Number(matematicas) + Number(lengua_espanola) + Number(naturales) + Number(sociales)) /
      4
    ).toFixed(2);
  }
  return '--';
}

// ── Date formatting (local/es-DO) ──────────────────────────────────────────────

export function formatearFechaLocal(fechaStr: Date | string | null | undefined): string {
  if (!fechaStr) return 'No registrada';
  const fechaStrLimpa = String(fechaStr).split('T')[0];
  const parts = fechaStrLimpa.split('-');
  if (parts.length === 3) {
    const date = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
    return date.toLocaleDateString('es-DO', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }
  return new Date(fechaStr).toLocaleDateString('es-DO');
}

// ── Schedule helpers ────────────────────────────────────────────────────────────

export function esHorarioMatutino(hora: string): boolean {
  const h = parseInt(hora?.split(':')[0] ?? '12');
  return h < 12;
}

const mapeoDias: Record<string, number> = {
  domingo: 0, lunes: 1, martes: 2, miercoles: 3, jueves: 4, viernes: 5, sabado: 6,
};

export function generarFechasDelMes(
  horarios: { dia: string }[],
  selectedMonth: string,
): string[] {
  const validDays = (horarios || []).map(h => mapeoDias[h.dia]);
  const [year, month] = selectedMonth.split('-').map(Number);
  const daysInMonth = new Date(year, month, 0).getDate();
  const fechas: string[] = [];
  for (let i = 1; i <= daysInMonth; i++) {
    const d = new Date(year, month - 1, i);
    if (validDays.length === 0 || validDays.includes(d.getDay())) {
      const mStr = String(month).padStart(2, '0');
      const dStr = String(i).padStart(2, '0');
      fechas.push(`${year}-${mStr}-${dStr}`);
    }
  }
  return fechas;
}

export function validarFiltrosGlobales(params: {
  tipoPeriodo: TipoPeriodo;
  fechaDia: string;
  mesSeleccionado: string;
  fechaInicio: string;
  fechaFin: string;
}): string | null {
  const { tipoPeriodo, fechaDia, mesSeleccionado, fechaInicio, fechaFin } = params;

  switch (tipoPeriodo) {
    case 'dia':
      if (!fechaDia) return 'Por favor selecciona una fecha';
      break;
    case 'mes':
      if (!mesSeleccionado) return 'Por favor selecciona un mes';
      break;
    case 'rango':
      if (!fechaInicio || !fechaFin) return 'Por favor selecciona las fechas de inicio y fin';
      if (new Date(fechaInicio) > new Date(fechaFin)) return 'La fecha de inicio no puede ser mayor a la fecha fin';
      break;
  }
  return null;
}
