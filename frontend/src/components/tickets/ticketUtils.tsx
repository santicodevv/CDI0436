import { isAxiosError } from 'axios';
import type { EstadoTicket, PrioridadTicket, TipoTicket } from '@/lib/api/tickets';
import { ticketsApi } from '@/lib/api/tickets';

export const ESTADOS: Record<EstadoTicket, { label: string; clase: string }> = {
  abierto: { label: 'Abierto', clase: 'bg-blue-100 text-blue-800' },
  en_progreso: { label: 'En progreso', clase: 'bg-amber-100 text-amber-800' },
  completado: { label: 'Completado', clase: 'bg-green-100 text-green-800' },
  rechazado: { label: 'Rechazado', clase: 'bg-gray-200 text-gray-700' },
};

export const TIPOS: Record<TipoTicket, string> = {
  mejora: 'Nueva función o mejora',
  error: 'Algo no funciona',
  otro: 'Otro',
};

export const PRIORIDADES: Record<PrioridadTicket, { label: string; clase: string }> = {
  baja: { label: 'Baja', clase: 'text-gray-500' },
  media: { label: 'Media', clase: 'text-amber-600' },
  alta: { label: 'Alta', clase: 'text-red-600 font-semibold' },
};

export function EstadoBadge({ estado }: { estado: EstadoTicket }) {
  const { label, clase } = ESTADOS[estado] ?? ESTADOS.abierto;
  return <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ${clase}`}>{label}</span>;
}

export const formatFechaHora = (fecha: string): string =>
  new Date(fecha).toLocaleString('es-DO', { dateStyle: 'medium', timeStyle: 'short' });

export function mensajeErrorApi(err: unknown, porDefecto: string): string {
  if (isAxiosError(err)) {
    const message = err.response?.data?.message;
    if (typeof message === 'string' && message) return message;
  }
  return porDefecto;
}

// Abre el PDF en otra pestaña; la ventana se abre antes de la descarga para que
// el navegador no la bloquee como ventana emergente.
export async function abrirDocumentoTicket(id: string): Promise<void> {
  const ventana = window.open('', '_blank');
  try {
    const blob = await ticketsApi.documento(id);
    const url = URL.createObjectURL(new Blob([blob], { type: 'application/pdf' }));
    if (ventana) ventana.location.href = url;
    else window.location.href = url;
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
  } catch {
    ventana?.close();
    alert('No se pudo abrir el documento.');
  }
}
